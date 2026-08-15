import { ConflictError, UnauthenticatedError } from "../../errors/RequestError";
import {
  createUser,
  getUserByEmail,
  isUserExists,
  recordSuccessfulLogin,
  updateLoginAttempt,
} from "./auth.repo";
import { LoginUserInput, RegisterUserInput } from "./auth.schema";
import argon2 from "argon2";
import { PublicUser, PublicUserWithToken } from "./auth.types";
import { convertToPublicUser } from "./auth.utils";
import { signInToken } from "../../lib/jwt";

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
): Promise<PublicUserWithToken> => {
  const user = await getUserByEmail(userInput.email);

  if (!user) {
    throw new UnauthenticatedError("Invalid email or password");
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
  await recordSuccessfulLogin(user.id);
  return {
    user: convertToPublicUser(user),
    token: accessToken,
  };
};
