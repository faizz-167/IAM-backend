import nodemailer, { TransportOptions } from "nodemailer";
import { env } from "./env";

export const mailer = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: { user: env.smtp.user, pass: env.smtp.pass },
} as TransportOptions);
