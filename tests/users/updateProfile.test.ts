import { describe, expect, it, vi } from "vitest";
import { spawnApp } from "../testApp.js";

describe("Users", () => {
	describe("Update Profile", () => {
		it("Should return 200 status code when data is valid", async () => {
			const app = await spawnApp();
			const setSpy = vi.spyOn(app.redis, "set");
			const getSpy = vi.spyOn(app.redis, "get");

			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const verifyResponse = await app.createAndVerify(data);

			const res = await app.updateProfile({
				email:"changed@gmail.com",
				aboutMe: "Changed about me"
			}, verifyResponse.get("Set-Cookie"));

			expect(res.statusCode).toBe(200)

			expect(setSpy).toBeCalledTimes(2);
			expect(getSpy).toBeCalledTimes(1);

			await app.close();
		});
	});
});
