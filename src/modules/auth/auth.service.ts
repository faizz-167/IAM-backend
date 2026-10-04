import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  UnauthenticatedError,
} from "../../errors/RequestError";
import {
  recordSuccessfulLogin,
  updateEmailVerificationStatus,
  updateLoginAttempt,
  updateUserStatus,
} from "./auth.repo";
import { LoginUserInput, RegisterUserInput } from "./auth.schema";
import argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { LoginResult, PublicUser, RefreshResult } from "./auth.types";
import { convertToPublicUser, generateOtp } from "./auth.utils";
import { signInToken } from "../../lib/jwt";
import { generateRefreshToken, hashToken } from "../../lib/token";
import { env } from "../../config/env";
import {
  createSession,
  findSessionByTokenHash,
  revokeAllUserSessions,
  revokeSession,
  revokeSessionFamily,
  rotateSession,
} from "../sessions/sessions.repo";
import { denyAccessForSessions } from "../../lib/accessTokenDenylist";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../../common-services/mail.service";
import { describeDevice } from "../../lib/deviceName";
import { recordAudit } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/audit.types";
import { redisClient } from "../../lib/redis";
import { logger } from "../../lib/logger";
import {
  createUser,
  getUserByEmail,
  getUserById,
  isUserExists,
  updatePasswordHash,
} from "../users/user.repo";
import { MAX_OTP_ATTEMPTS } from "../../constants";

const emailVerifyKey = (userId: string) => `email_verify:${userId}`;
const emailVerifyAttemptsKey = (userId: string) =>
  `email_verify_attempts:${userId}`;
// Keyed by the token's hash so the raw token never sits in Redis. The per-user
// key points at the live token so a new request can kill the previous one.
const passwordResetKey = (tokenHash: string) => `password_reset:${tokenHash}`;
const passwordResetUserKey = (userId: string) =>
  `password_reset_user:${userId}`;

export const registerUser = async (
  userInput: RegisterUserInput,
): Promise<PublicUser> => {
  const exsistingUser = await isUserExists(userInput.email);
  if (exsistingUser) {
    throw new ConflictError(
      "A User with this email already exists, please login instead",
    );
  }

  const password_hash = await argon2.hash(userInput.password, {
    type: argon2.argon2id,
  });

  const newUser = await createUser({
    display_name: userInput.display_name,
    email: userInput.email,
    password_hash,
  });

  await recordAudit({
    action: AUDIT_ACTIONS.USER_REGISTERED,
    resource: "USER",
    actorUserId: newUser.id,
    targetId: newUser.id,
  });

  return convertToPublicUser(newUser);
};

let dummyPasswordHash: Promise<string> | null = null;
const getDummyPasswordHash = (): Promise<string> => {
  dummyPasswordHash ??= argon2.hash(generateRefreshToken(), {
    type: argon2.argon2id,
  });
  return dummyPasswordHash;
};

export const loginUser = async (
  userInput: LoginUserInput,
  meta?: { ip_address?: string; user_agent?: string },
): Promise<LoginResult> => {
  const user = await getUserByEmail(userInput.email);

  if (!user) {
    await argon2
      .verify(await getDummyPasswordHash(), userInput.password)
      .catch(() => false);
    throw new UnauthenticatedError("Invalid email or password");
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new UnauthenticatedError(
      "Account temporarily locked due to too many failed login attempts",
    );
  }

  const isValidPassword = await argon2.verify(
    user.password_hash,
    userInput.password,
  );
  if (!isValidPassword) {
    await updateLoginAttempt(user.id);
    await recordAudit({
      action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
      resource: "USER",
      actorUserId: null,
      targetId: user.id,
    });
    throw new UnauthenticatedError("Invalid email or password");
  }

  if (user.status !== "ACTIVE" && user.status !== "PENDING") {
    throw new UnauthenticatedError("User account is not active");
  }

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  const expiresAt = new Date(
    Date.now() + env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  // The session has to exist before the access token is signed: the token
  // carries its id so revoking the session can invalidate the token.
  const session = await createSession({
    user_id: user.id,
    refresh_token_hash: refreshTokenHash,
    expires_at: expiresAt,
    ip_address: meta?.ip_address ?? null,
    user_agent: meta?.user_agent ?? null,
    device_name: describeDevice(meta?.user_agent),
  });

  const accessToken = signInToken(user.id, session.id);

  await recordSuccessfulLogin(user.id);
  await recordAudit({
    action: AUDIT_ACTIONS.USER_LOGIN,
    resource: "USER",
    actorUserId: user.id,
    targetId: user.id,
    metadata: { session_id: session.id },
  });

  return {
    user: convertToPublicUser(user),
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (
  currentRefreshToken: string,
  meta?: { ip_address?: string; user_agent?: string },
): Promise<RefreshResult> => {
  const tokenHash = hashToken(currentRefreshToken);
  const session = await findSessionByTokenHash(tokenHash);

  if (!session) {
    throw new UnauthenticatedError("Invalid refresh token");
  }

  if (session.revoked_at !== null) {
    await denyAccessForSessions(await revokeSessionFamily(session.family_id));
    throw new UnauthenticatedError(
      "Refresh token reuse detected — all sessions in this family have been revoked",
    );
  }

  if (new Date(session.expires_at) < new Date()) {
    await denyAccessForSessions(await revokeSession(session.id));
    throw new UnauthenticatedError("Refresh token has expired");
  }

  const user = await getUserById(session.user_id);
  if (!user || (user.status !== "ACTIVE" && user.status !== "PENDING")) {
    await denyAccessForSessions(await revokeSessionFamily(session.family_id));
    throw new UnauthenticatedError("User account is not active");
  }

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);

  const expiresAt = new Date(
    Date.now() + env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Insert-then-revoke in one transaction; throws if another refresh already
  // consumed this token.
  const newSession = await rotateSession(session.id, {
    user_id: session.user_id,
    refresh_token_hash: newTokenHash,
    expires_at: expiresAt,
    ip_address: meta?.ip_address ?? null,
    user_agent: meta?.user_agent ?? null,
    device_name: describeDevice(meta?.user_agent),
    family_id: session.family_id,
  });

  const accessToken = signInToken(session.user_id, newSession.id);

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutSession = async (refreshToken: string): Promise<void> => {
  const tokenHash = hashToken(refreshToken);
  const session = await findSessionByTokenHash(tokenHash);

  if (session && session.revoked_at === null) {
    await denyAccessForSessions(await revokeSession(session.id));
    await recordAudit({
      action: AUDIT_ACTIONS.USER_LOGOUT,
      resource: "USER",
      actorUserId: session.user_id,
      targetId: session.user_id,
      metadata: { session_id: session.id },
    });
  }
};

export const logoutAllSessions = async (userId: string): Promise<void> => {
  const revoked = await revokeAllUserSessions(userId);
  await denyAccessForSessions(revoked);
  await recordAudit({
    action: AUDIT_ACTIONS.USER_LOGOUT_ALL,
    resource: "USER",
    actorUserId: userId,
    targetId: userId,
    metadata: { revoked_sessions: revoked.length },
  });
};

export const getCurrentUser = async (userId: string): Promise<PublicUser> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new UnauthenticatedError("User not found");
  }

  if (user.status !== "ACTIVE" && user.status !== "PENDING") {
    throw new UnauthenticatedError("User is not active");
  }
  return convertToPublicUser(user);
};

export const requestEmail = async (userId: string): Promise<void> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new UnauthenticatedError("User not found");
  }

  if (user.status !== "PENDING") {
    throw new UnauthenticatedError(
      "User is unable to request email verification or has already verified their email",
    );
  }

  const otp = generateOtp();
  await redisClient.setex(
    emailVerifyKey(userId),
    env.emailVerificationTtlMinutes * 60,
    otp,
  );
  await redisClient.del(emailVerifyAttemptsKey(userId));

  try {
    await sendVerificationEmail({
      email: user.email,
      displayName: user.display_name,
      otp,
    });
  } catch (error) {
    logger.error(error, "Failed to send verification email");
    throw new InternalServerError("Failed to send verification email");
  }
};

export const verifyEmail = async (
  userId: string,
  otp: string,
): Promise<PublicUser> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new UnauthenticatedError("User not found");
  }

  if (user.status !== "PENDING") {
    throw new BadRequestError(
      "User is unable to verify email or has already verified their email",
    );
  }

  const attemptsKey = emailVerifyAttemptsKey(userId);
  const attempts = Number((await redisClient.get(attemptsKey)) ?? "0");
  if (attempts >= MAX_OTP_ATTEMPTS) {
    await redisClient.del(emailVerifyKey(userId));
    await redisClient.del(attemptsKey);
    throw new BadRequestError(
      "Too many incorrect attempts, please request a new OTP",
    );
  }

  const storedOtp = await redisClient.get(emailVerifyKey(userId));
  if (!storedOtp || storedOtp !== otp) {
    await redisClient.incr(attemptsKey);
    await redisClient.expire(attemptsKey, env.emailVerificationTtlMinutes * 60);
    throw new BadRequestError("OTP has expired or is invalid");
  }

  await redisClient.del(emailVerifyKey(userId));
  await redisClient.del(attemptsKey);
  await updateEmailVerificationStatus(userId);
  await updateUserStatus(userId, "ACTIVE");
  await recordAudit({
    action: AUDIT_ACTIONS.USER_EMAIL_VERIFIED,
    resource: "USER",
    actorUserId: userId,
    targetId: userId,
  });

  return await getCurrentUser(userId);
};

const issuePasswordReset = async (userId: string): Promise<void> => {
  const user = await getUserById(userId);
  if (!user) {
    return;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const ttlSeconds = env.passwordResetTtlMinutes * 60;

  const previousHash = await redisClient.get(passwordResetUserKey(userId));
  const pipeline = redisClient.pipeline();
  if (previousHash) {
    pipeline.del(passwordResetKey(previousHash));
  }
  pipeline.setex(passwordResetKey(tokenHash), ttlSeconds, userId);
  pipeline.setex(passwordResetUserKey(userId), ttlSeconds, tokenHash);
  await pipeline.exec();

  await sendPasswordResetEmail({
    email: user.email,
    displayName: user.display_name,
    token,
  });

  await recordAudit({
    action: AUDIT_ACTIONS.USER_PASSWORD_RESET_REQUESTED,
    resource: "USER",
    actorUserId: null,
    targetId: userId,
  });
};

/**
 * Responds the same way whether or not the address has an account. The token
 * and email are produced off the request path, so response time does not
 * reveal it either.
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await getUserByEmail(email);
  if (!user) {
    return;
  }

  void issuePasswordReset(user.id).catch((error) => {
    logger.error({ err: error }, "Failed to issue password reset");
  });
};

export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<void> => {
  const tokenHash = hashToken(token);

  // GETDEL makes the token single-use even under concurrent submissions.
  const userId = await redisClient.getdel(passwordResetKey(tokenHash));
  if (!userId) {
    throw new BadRequestError("Reset link is invalid or has expired");
  }
  await redisClient.del(passwordResetUserKey(userId));

  const user = await getUserById(userId);
  if (!user) {
    throw new BadRequestError("Reset link is invalid or has expired");
  }

  const passwordHash = await argon2.hash(newPassword, {
    type: argon2.argon2id,
  });
  await updatePasswordHash(userId, passwordHash);

  const revoked = await revokeAllUserSessions(userId);
  await denyAccessForSessions(revoked);

  await recordAudit({
    action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
    resource: "USER",
    actorUserId: userId,
    targetId: userId,
    metadata: { revoked_sessions: revoked.length },
  });
};
