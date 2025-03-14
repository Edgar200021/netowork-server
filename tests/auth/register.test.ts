import { expect, describe } from 'vitest'
import { spawnApp } from '../test-app.js'
import { createValidationError } from '../utils.js'

describe('Authentication', () => {
  describe('Register', () => {
    describe('Register with valid data returns 201 status code', async () => {
      const app = await spawnApp()

      const response = await app.register({
        role: 'client',
        firstName: 'Thomas',
        lastName: 'Thomason',
        email: 'test@mail.com',
        password: 'password',
      })

      console.log('RESPONSE', response)

      expect(response.statusCode).toBe(201)
    })

    describe('Register with invalid data returns 400 status code', async () => {
      const app = await spawnApp()
      const testCases = [
        {
          reqBody: {
            role: 'client',
            firstName: 'Thomas',
            lastName: 'Thomason',
            password: 'password',
          },
          resBody: createValidationError('email'),
        },

        {
          reqBody: {
            role: 'client',
            firstName: 'John',
            lastName: 'Doe',
            email: 'test@mail.com',
          },
          resBody: createValidationError('password'),
        },
        {
          reqBody: {
            role: 'admin',
            firstName: 'Dana',
            lastName: 'White',
            email: 'easatr',
            password: 'passw',
          },
          resBody: createValidationError('role', 'email', 'password'),
        },
      ]

      for (const testCase of testCases) {
        const response = await app.register(testCase.reqBody)

        expect(response.statusCode).toBe(400)
        expect(response.body).toMatchObject(testCase.resBody)
      }
    })
  })
})
