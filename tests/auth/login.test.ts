import { describe, expect, it } from 'vitest'
import { spawnApp } from '../testApp.js'
import { createValidationError } from '../utils.js'

describe('Authentication', () => {
  describe('Login', () => {
    it('Login with valid data returns 200 status code', async () => {
      const app = await spawnApp()
      const data = {
        role: 'client',
        firstName: 'Thomas',
        lastName: 'Thomson',
        email: 'test@mail.com',
        password: 'password',
        passwordConfirmation: 'password',
      }

      await app.createAndVerify(data)

      const response = await app.login({
        email: data.email,
        password: data.password,
      })


      expect(response.statusCode).toBe(200)
      expect(response.headers).toHaveProperty('set-cookie')
      expect(response.body).not.toBeUndefined()
      expect(response.body).toBeTypeOf('object')
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('data')

      for (const property of [
        'firstName',
        'lastName',
        'email',
        'role',
        'aboutMe',
        'avatar',
      ]) {
        expect(response.body.data).toHaveProperty(property)
      }

      await app.close()
    })

    it('Login with invalid data returns 400 status code', async () => {
      const app = await spawnApp()
      const testCases = [
        {
          reqBody: {
            email: 'test@mail.com',
          },
          resBody: createValidationError('password'),
        },
        {
          reqBody: {
            password: 'password',
          },
          resBody: createValidationError('email'),
        },
      ]

      for (const testCase of testCases) {
        const response = await app.login(testCase.reqBody)

        expect(response.statusCode).toBe(400)
        expect(Object.keys(response.body)).toEqual(
          Object.keys(testCase.resBody)
        )
        expect(Object.keys(response.body.errors)).toEqual(
          Object.keys(testCase.resBody.errors)
        )
      }

      await app.close()
    })

    it('Login with not existing account returns 400 status code', async () => {
      const app = await spawnApp()

      const response = await app.login({
        email: 'test@mail.com',
        password: 'password',
      })


      expect(response.statusCode).toBe(400)
      expect(response.body).toBeTypeOf('object')
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('error')
    })

    it('Login with not verified account returns 400 status code', async () => {
      const app = await spawnApp()
      const data = {
        role: 'client',
        firstName: 'Thomas',
        lastName: 'Thomson',
        email: 'test@mail.com',
        password: 'password',
        passwordConfirmation: 'password',
      }

      await app.register(data)

      const response = await app.login({
        email: data.email,
        password: data.password,
      })

      expect(response.statusCode).toBe(400)
      expect(response.body).toBeTypeOf('object')
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('error')

      await app.close()
    })

    it('Login with banned account returns 403 status code', async () => {
      const app = await spawnApp()
      const data = {
        role: 'client',
        firstName: 'Thomas',
        lastName: 'Thomson',
        email: 'test@mail.com',
        password: 'password',
        passwordConfirmation: 'password',
      }

      await app.createAndVerify(data)
      await app.database
        .updateTable('users')
        .set({
          isBanned: true,
        })
        .where('email', '=', data.email)
        .execute()

      const response = await app.login({
        email: data.email,
        password: data.password,
      })


      expect(response.statusCode).toBe(403)
      expect(response.body).toBeTypeOf('object')
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('error')

      await app.close()
    })
  })
})
