import { describe, expect, it, vi } from 'vitest'
import { spawnApp } from '../testApp.js'

describe('Authentication', () => {
  describe('Account Verification', () => {
    it('Account Verification with valid token returns 200 status code', async () => {
      const app = await spawnApp()
      const getSpy = vi.spyOn(app.redis, 'get')
      const delSpy = vi.spyOn(app.redis, 'del')

      await app.register({
        role: 'client',
        firstName: 'Thomas',
        lastName: 'Thomson',
        email: 'test@mail.com',
        password: 'password',
        passwordConfirmation: 'password',
      })

      const token = (await app.redis.keys('*'))[0]

      expect(token).not.toBeNull()

      const response = await app.verify(token)

      expect(response.statusCode).toBe(200)
      expect(response.body).toBeTypeOf('object')
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('data')

      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(delSpy).toHaveBeenCalledTimes(1)
      expect(getSpy).toHaveBeenCalledWith(token)
      expect(delSpy).toHaveBeenCalledWith(token)

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

    it('Account Verification with invalid token returns 404 status code', async () => {
      const app = await spawnApp()
      const getSpy = vi.spyOn(app.redis, 'get')

      const response = await app.verify('invalid-token')

      expect(response.statusCode).toBe(404)
      expect(response.body).toBeTypeOf('object')
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('error')

      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(getSpy).toHaveBeenCalledWith('invalid-token')

	  await app.close()
    })
  })

  it('Account Verification with expired token returns 404 status code', async () => {
    const app = await spawnApp()
    const getSpy = vi.spyOn(app.redis, 'get')

    await app.register({
      role: 'client',
      firstName: 'Thomas',
      lastName: 'Thomson',
      email: 'test@mail.com',
      password: 'password',
      passwordConfirmation: 'password',
    })

    const token = (await app.redis.keys('*'))[0]

    expect(token).not.toBeNull()

    await app.redis.expire(token, 0)
    const response = await app.verify(token)

    expect(response.statusCode).toBe(404)
    expect(response.body).toBeTypeOf('object')
    expect(response.body).toHaveProperty('status')
    expect(response.body).toHaveProperty('error')

    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(getSpy).toBeCalledWith(token)

	await app.close()
  })
})
