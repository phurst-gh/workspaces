// This file contains pure logic, no Express.

import { Role } from "@prisma/client";
import { AppError } from "@/shared/errors/AppError";
import { ErrorCode } from "@/shared/errors/ErrorCode";
import type { ApiUser } from "@/shared/types/express";
import { hashPassword, verifyPassword, verifyRefreshToken } from "../lib";
import { userRepository } from "../repositories/userRepository";
import { generateJWTs } from "../utils/generateJWTs";
import { validateEmail, validatePassword } from "../validators";

/**
 * Auth Service Implementation
 *
 * This implementation handles the business logic for authentication.
 * Controllers call these functions and handle HTTP-specific concerns.
 */

type AuthResult = {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
};

type RefreshResult = {
  accessToken: string;
  refreshToken: string;
};

type AuthService = {
  login(UserCredentials: UserCredentials): Promise<AuthResult>;
  register(UserCredentials: UserCredentials): Promise<AuthResult>;
  refreshToken(token: string): Promise<RefreshResult>;
  logout(refreshToken: string): Promise<void>;
};

type UserCredentials = {
  email: string;
  password: string;
};

const login = async (UserCredentials: UserCredentials): Promise<AuthResult> => {
  // 1. Validate input
  const validatedEmail = validateEmail(UserCredentials.email);
  const validatedPassword = validatePassword(UserCredentials.password);

  // 2. Query database for user
  const user = await userRepository.findByEmail(validatedEmail);
  if (!user) {
    throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, "Invalid email or password");
  }

  // 3. Verify password
  const isPasswordValid = await verifyPassword(validatedPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, "Invalid email or password");
  }

  // 4. Generate tokens
  const { refreshToken: newRefreshToken, accessToken } = generateJWTs(
    user.id,
    user.email,
    user.role,
  );

  // 5. Return result
  return {
    message: "Login successfully",
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      role: user.role,
    },
  };
};

const register = async (UserCredentials: UserCredentials): Promise<AuthResult> => {
  // 1. Validate input & hash password
  const validatedEmail = validateEmail(UserCredentials.email);
  const validatedPassword = validatePassword(UserCredentials.password);
  const hashedPassword = await hashPassword(validatedPassword);

  // 2. Check if email already exists
  const emailExists = await userRepository.findByEmail(validatedEmail);
  if (emailExists) {
    throw new AppError(409, ErrorCode.EMAIL_EXISTS, "A user with this email already exists");
  }

  // 3. Create user in database (Generating only USER role for now)
  const user = await userRepository.create(validatedEmail, hashedPassword, Role.USER);
  if (!user) {
    throw new AppError(500, ErrorCode.INTERNAL_SERVER_ERROR, "Failed to create user");
  }

  // 5. Generate tokens
  const { refreshToken: newRefreshToken, accessToken } = generateJWTs(
    user.id,
    user.email,
    user.role,
  );

  return {
    message: "User created successfully",
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      role: user.role,
    },
  };
};

const refreshToken = async (token: string): Promise<RefreshResult> => {
  try {
    // 1. Verify the refresh token is valid and not expired
    const payload = verifyRefreshToken(token);

    // 2. Verify user still exists
    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new AppError(401, ErrorCode.INVALID_REFRESH_TOKEN, "User not found");
    }

    // 3. Generate new tokens with complete user data
    const { refreshToken: newRefreshToken, accessToken } = generateJWTs(
      user.id,
      user.email,
      user.role,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new AppError(401, ErrorCode.INVALID_REFRESH_TOKEN, "Refresh token is invalid or expired");
  }
};

const logout = async (): Promise<void> => {
  // The main work happens in the controller (clearing the cookie)
  // This is just for potential future features like:
  // - Logging the logout event
  // - Blacklisting the refresh token (if required later)
  // - Cleanup tasks
};

export const authService: AuthService = {
  login,
  register,
  refreshToken,
  logout,
};
