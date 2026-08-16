import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  UnauthenticatedError,
} from "../../errors/RequestError";
import {
  createUser,
  getUserByEmail,
  getUserById,
  isUserExists,
  recordSuccessfulLogin,
  updateEmailVerificationStatus,
  updateLoginAttempt,
  updateUserStatus,
} from "./auth.repo";
import { LoginUserInput, RegisterUserInput } from "./auth.schema";
import argon2 from "argon2";
import { LoginResult, PublicUser, RefreshResult } from "./auth.types";
import { convertToPublicUser, generateOtp } from "./auth.utils";
import { signInToken } from "../../lib/jwt";
import { generateRefreshToken, hashToken } from "../../lib/token";
import { env } from "../../config/env";
import {
  createSession,
  findSessionByTokenHash,
  markSessionReplaced,
  revokeAllUserSessions,
  revokeSession,
  revokeSessionFamily,
} from "../sessions/sessions.repo";
import { sendVerificationEmail } from "../../common-services/mail.service";
import { redisClient } from "../../lib/redis";
import { logger } from "../../lib/logger";

const emailVerifyKey = (userId: string) => `email_verify:${userId}`;

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

  return convertToPublicUser(newUser);
};

export const loginUser = async (
  userInput: LoginUserInput,
  meta?: { ip_address?: string; user_agent?: string },
): Promise<LoginResult> => {
  const user = await getUserByEmail(userInput.email);

  if (!user) {
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
    throw new UnauthenticatedError("Invalid email or password");
  }

  const accessToken = signInToken(user.id);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  const expiresAt = new Date(
    Date.now() + env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  await createSession({
    user_id: user.id,
    refresh_token_hash: refreshTokenHash,
    expires_at: expiresAt,
    ip_address: meta?.ip_address ?? null,
    user_agent: meta?.user_agent ?? null,
  });

  await recordSuccessfulLogin(user.id);

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
    await revokeSessionFamily(session.family_id);
    throw new UnauthenticatedError(
      "Refresh token reuse detected — all sessions in this family have been revoked",
    );
  }

  if (new Date(session.expires_at) < new Date()) {
    await revokeSession(session.id);
    throw new UnauthenticatedError("Refresh token has expired");
  }

  const user = await getUserById(session.user_id);
  if (!user || (user.status !== "ACTIVE" && user.status !== "PENDING")) {
    await revokeSessionFamily(session.family_id);
    throw new UnauthenticatedError("User account is not active");
  }

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);

  const expiresAt = new Date(
    Date.now() + env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const newSession = await createSession({
    user_id: session.user_id,
    refresh_token_hash: newTokenHash,
    expires_at: expiresAt,
    ip_address: meta?.ip_address ?? null,
    user_agent: meta?.user_agent ?? null,
    family_id: session.family_id,
  });

  const replaced = await markSessionReplaced(session.id, newSession.id);
  if (!replaced) {
    await revokeSession(newSession.id);
    throw new UnauthenticatedError("Invalid refresh token");
  }

  const accessToken = signInToken(session.user_id);

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutSession = async (refreshToken: string): Promise<void> => {
  const tokenHash = hashToken(refreshToken);
  const session = await findSessionByTokenHash(tokenHash);

  if (session && session.revoked_at === null) {
    await revokeSession(session.id);
  }
};

export const logoutAllSessions = async (userId: string): Promise<void> => {
  await revokeAllUserSessions(userId);
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

  const storedOtp = await redisClient.get(emailVerifyKey(userId));
  if (!storedOtp || storedOtp !== otp) {
    throw new BadRequestError("OTP has expired or is invalid");
  }

  await redisClient.del(emailVerifyKey(userId));
  await updateEmailVerificationStatus(userId);
  await updateUserStatus(userId, "ACTIVE");

  return await getCurrentUser(userId);
};
