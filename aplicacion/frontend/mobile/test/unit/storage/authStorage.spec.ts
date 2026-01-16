import { clearTokens, getRefreshToken, getToken, getUserName, setRefreshToken, setToken, setUserName } from '../../../src/storage/authStorage'

describe('storage/authStorage', () => {
  beforeEach(async () => {
    await clearTokens()
  })

  it('stores and returns access token', async () => {
    await setToken('t1')
    await expect(getToken()).resolves.toBe('t1')
  })

  it('stores and returns refresh token', async () => {
    await setRefreshToken('r1')
    await expect(getRefreshToken()).resolves.toBe('r1')
  })

  it('stores and returns user name', async () => {
    await setUserName('Denis')
    await expect(getUserName()).resolves.toBe('Denis')
  })

  it('clears all values', async () => {
    await setToken('t1')
    await setRefreshToken('r1')
    await setUserName('Denis')
    await clearTokens()
    await expect(getToken()).resolves.toBeNull()
    await expect(getRefreshToken()).resolves.toBeNull()
    await expect(getUserName()).resolves.toBeNull()
  })
})

