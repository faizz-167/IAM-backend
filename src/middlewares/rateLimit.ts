import rateLimit, { type Options } from "express-rate-limit";
import { TooManyRequestsError } from "../errors/RequestError";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const rejectWithError = (message: string): Partial<Options> => ({
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, _res, next) => next(new TooManyRequestsError(message)),
});

/** Coarse backstop for the whole API. */
export const globalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 300,
  ...rejectWithError("Too many requests, please try again later"),
});

/** Credential endpoints: login, refresh, logout. */
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 10,
  skipSuccessfulRequests: true,
  ...rejectWithError(
    "Too many authentication attempts, please try again later",
  ),
});

/** Account creation. */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  ...rejectWithError("Too many accounts created, please try again later"),
});

/** OTP request and verification — the cheapest brute-force target. */
export const otpLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 5,
  ...rejectWithError("Too many verification attempts, please try again later"),
});
