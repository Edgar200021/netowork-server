import { spawnApp } from '../test-app.js'

describe('Authentication', () => {
  describe('Login', () => {
    describe('Login with valid credentials returns 200 status code', () => {})
  })

  describe('Register', () => {
    describe('Register with valid credentials returns 201 status code', async () => {
      const app = await spawnApp()

      const response = await app.register({
        role: 'client',
        firstName: 'Edgar',
        lastName: 'Edgar',
        email: 'easatryan2000@mail.com',
        password: 'password',
      })

      expect(response.statusCode).toBe(201)
    })
  })
})
