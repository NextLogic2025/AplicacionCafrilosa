jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}))

describe('services/auth/authClient', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;(global as any).fetch = jest.fn()

    process.env.EXPO_PUBLIC_API_BASE_URL = ''
    process.env.EXPO_PUBLIC_AUTH_API_URL = ''
    process.env.EXPO_PUBLIC_AUTH_LOGIN_URL = ''
    process.env.EXPO_PUBLIC_AUTH_FORGOT_PASSWORD_URL = ''
  })

  it('signIn stores tokens and username', async () => {
    process.env.EXPO_PUBLIC_AUTH_LOGIN_URL = 'http://auth.local/login'

    ;(global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        usuario: { nombre: 'Denis', role: 'cliente', email: 'a@b.com' },
      }),
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { signIn } = require('../../../../src/services/auth/authClient')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getToken, getRefreshToken, getUserName } = require('../../../../src/storage/authStorage')

    const res = await signIn('a@b.com', 'pw')
    expect(res.token).toBe('access-1')
    expect(res.user?.role).toBe('cliente')
    await expect(getToken()).resolves.toBe('access-1')
    await expect(getRefreshToken()).resolves.toBe('refresh-1')
    await expect(getUserName()).resolves.toBe('Denis')
  })

  it('getValidToken returns existing token if not expired', async () => {
    process.env.EXPO_PUBLIC_AUTH_LOGIN_URL = 'http://auth.local/login'

    const { jwtDecode } = jest.requireMock('jwt-decode') as { jwtDecode: jest.Mock }
    jwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600, sub: 'u1' })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { setToken } = require('../../../../src/storage/authStorage')
    await setToken('token-ok')

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getValidToken } = require('../../../../src/services/auth/authClient')

    await expect(getValidToken()).resolves.toBe('token-ok')
    expect((global as any).fetch).not.toHaveBeenCalled()
  })

  it('getValidToken refreshes token when expired', async () => {
    process.env.EXPO_PUBLIC_AUTH_LOGIN_URL = 'http://auth.local/login'

    const { jwtDecode } = jest.requireMock('jwt-decode') as { jwtDecode: jest.Mock }
    jwtDecode.mockReturnValue({ exp: 1, sub: 'u1' })

    ;(global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'token-new',
        refresh_token: 'refresh-new',
      }),
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { setToken, setRefreshToken, getToken, getRefreshToken } = require('../../../../src/storage/authStorage')
    await setToken('token-expired')
    await setRefreshToken('"refresh-old"')

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getValidToken } = require('../../../../src/services/auth/authClient')

    await expect(getValidToken()).resolves.toBe('token-new')
    await expect(getToken()).resolves.toBe('token-new')
    await expect(getRefreshToken()).resolves.toBe('refresh-new')

    expect((global as any).fetch).toHaveBeenCalledWith('http://auth.local/auth/refresh', expect.any(Object))
  })

  it('signOut clears tokens even if backend logout fails', async () => {
    process.env.EXPO_PUBLIC_AUTH_LOGIN_URL = 'http://auth.local/login'

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    ;(global as any).fetch.mockRejectedValue(new Error('network'))

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { setToken, setRefreshToken, getToken, getRefreshToken } = require('../../../../src/storage/authStorage')
    await setToken('t1')
    await setRefreshToken('r1')

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { signOut } = require('../../../../src/services/auth/authClient')
    await signOut()

    await expect(getToken()).resolves.toBeNull()
    await expect(getRefreshToken()).resolves.toBeNull()
    warnSpy.mockRestore()
  })
})
