import { describe, expect, it, vi } from 'vitest'
import { spawnApp } from '../testApp.js'

describe('Authentication', () => {
  describe('Forgot Password', () => {
    it('Forgot Password with valid data returns 200 status code', async () => {
      const app = await spawnApp()
      const setSpy = vi.spyOn(app.redis, 'set')

      const data = {
        role: 'client',
        email: 'test@mail.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password',
        passwordConfirmation: 'password',
      }

      const verifyResponse = await app.createAndVerify(data)
      expect(verifyResponse.statusCode).toBe(200)

      const response = await app.forgotPassword({
        email: data.email,
      })

      expect(response.statusCode).toBe(200)
      expect(response.body).toBeTypeOf('object')
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toBeTypeOf('string')

      expect(setSpy).toHaveBeenCalledTimes(2)

      await app.close()
    })

    it('Forgot Password with invalid email returns 400 status code', async () => {
      const app = await spawnApp()

      const response = await app.forgotPassword({
        email: 'invalid-email',
      })

      expect(response.statusCode).toBe(400)
      expect(response.body).toBeTypeOf('object')
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('errors')
      expect(response.body.errors).toHaveProperty('email')

      await app.close()
    })

    it('Forgot Password with not registered email returns 404 status code', async () => {
      const app = await spawnApp()

      const response = await app.forgotPassword({
        email: 'test@mail.com',
      })

      expect(response.statusCode).toBe(404)
      expect(response.body).toBeTypeOf('object')
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('error')

      await app.close()
    })
  })
})
