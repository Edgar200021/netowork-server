import supertest from 'supertest'
import http from 'node:http'

describe('a', () => {
	describe("get not found", () => {
		it("should return 404", async () => {
			const server = http.createServer()

			await supertest(server).get('http://localhost:4000/').expect(404).end()
		})
	})
})