import { type Transporter, createTransport } from "nodemailer";
import { InternalServerError } from "../common/error.js";
import type { LoggerService } from "../common/services/logger.service.js";
import type { ApplicationConfig, EmailConfig } from "../config.js";
import type { Task } from "../storage/postgres/types/task.type.js";

export class EmailService {
	private readonly _clientUrl: string;
	private readonly _accountVerificationPath: string;
	private readonly _resetPasswordPath: string;
	private readonly _myTasksPath: string;

	private readonly _transport: Transporter;
	constructor(
		appConfig: ApplicationConfig,
		{ host, port, user, password, secure, from }: EmailConfig,
	) {
		this._accountVerificationPath = appConfig.accountVerificationPath;
		this._resetPasswordPath = appConfig.resetPasswordPath;
		this._clientUrl = appConfig.clientUrl;
		this._myTasksPath = appConfig.myTasksPath;

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

	async sendTaskReplyEmail(
		to: string,
		taskTitle: Task["title"],
		log: LoggerService,
	) {
		const subject = "You received a new reply to your task!";
		const url = `${this._clientUrl}${this._myTasksPath}`;
		const text = `Good news! Someone replied to your task: "${taskTitle}". Check it out here: ${url}`;
		const html = `
		<div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
			<p>Hi there,</p>
			<p>You’ve received a new reply to your task:</p>
			<blockquote style="margin: 1em 0; padding-left: 1em; border-left: 4px solid #007bff;">
				<strong>${taskTitle}</strong>
			</blockquote>
			<p>
				<a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
					View Task
				</a>
			</p>
			<p>Best regards,<br/>The Netowork Team</p>
		</div>
	`;

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
				"Failed to send task reply email",
				error,
			);
		}
	}
}
