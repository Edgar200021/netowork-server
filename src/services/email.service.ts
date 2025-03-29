import { type Transporter, createTransport } from "nodemailer";
import type { ApplicationConfig, EmailConfig } from "../config.js";
import { InternalServerError } from "./common/error.js";
import type { LoggerService } from "./common/services/logger.service.js";

export class EmailService {
	private readonly _clientUrl: string;
	private readonly _accountVerificationPath: string;
	private readonly _resetPasswordPath: string;

	private readonly _transport: Transporter;
	constructor(
		appConfig: ApplicationConfig,
		{ host, port, user, password, secure, from }: EmailConfig,
	) {
		this._accountVerificationPath = appConfig.accountVerificationPath;
		this._resetPasswordPath = appConfig.resetPasswordPath;
		this._clientUrl = appConfig.clientUrl;

		this._transport = createTransport({
			host,
			port: Number(port),
			auth: {
				user,
				pass: password,
			},
			secure: Boolean(secure),
			requireTLS: true,
			from,
		});
	}

	async sendVerificationEmail(to: string, token: string, log: LoggerService) {
		const subject = "Email Verification";
		const url = `${this._clientUrl}${this._accountVerificationPath}?token=${encodeURIComponent(token)}`;

		const text = `Please click the link to verify your email: ${url}`;
		const html = `<p>Please click the link to verify your email: <a href="${url}">${url}</a></p>`;

		try {
			await this._transport.sendMail({
				to,
				subject,
				text,
				html,
			});

			log.info(`Verification email sent to ${to} successfully`);
		} catch (error) {
			log.error(
				{ email: to, error: error instanceof Error ? error.message : error },
				"Failed to send verification email",
				error,
			);
			throw new InternalServerError("Failed to send verification email");
		}
	}

	async sendResetPasswordEmail(to: string, token: string, log: LoggerService) {
		const subject = "Password Reset";
		const url = `${this._clientUrl}${this._resetPasswordPath}?token=${encodeURIComponent(token)}`;

		const text = `Please click the link to reset your password: ${url}`;
		const html = `<p>Please click the link to reset your password: <a href="${url}">${url}</a></p>`;

		try {
			await this._transport.sendMail({
				to,
				subject,
				text,
				html,
			});
		} catch (error) {
			log.error(
				{
					email: to,
					error: error instanceof Error ? error.message : error,
				},
				"Failed to send reset password email",
				error,
			);
		}
	}
}
