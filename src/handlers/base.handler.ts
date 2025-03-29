import type { VineValidator } from "@vinejs/vine";
import type { SchemaTypes } from "@vinejs/vine/types";
import { Router } from "express";

export abstract class BaseHandler {
	protected validators: Record<string, VineValidator<SchemaTypes, undefined>> =
		{};
	protected readonly _router: Router;

	protected abstract bindMethods(): void;
	protected abstract setupRoutes(): void;

	constructor() {
		this._router = Router();
	}

	get router() {
		return this._router;
	}
}
