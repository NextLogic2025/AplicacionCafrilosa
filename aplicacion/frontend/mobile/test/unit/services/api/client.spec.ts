jest.mock('../../../../src/services/auth/authClient', () => ({
  getValidToken: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('../../../../src/navigation/navigationRef', () => ({
  resetToLogin: jest.fn(),
}))

describe('services/api/client apiRequest', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;(global as any).fetch = jest.fn()
    process.env.EXPO_PUBLIC_CATALOG_API_URL = 'http://catalog.local'
  })

  it('uses catalogUrl base for relative endpoint and sets Authorization', async () => {
    const { getValidToken } = jest.requireMock('../../../../src/services/auth/authClient') as { getValidToken: jest.Mock }
    getValidToken.mockResolvedValue('token-1')

    ;(global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify({ ok: true }),
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { apiRequest } = require('../../../../src/services/api/client')
    await expect(apiRequest('/api/health')).resolves.toEqual({ ok: true })

    expect((global as any).fetch).toHaveBeenCalledWith(
      'http://catalog.local/api/health',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
      })
    )
  })

  it('does not request token when auth:false', async () => {
    const { getValidToken } = jest.requireMock('../../../../src/services/auth/authClient') as { getValidToken: jest.Mock }

    ;(global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify({ ok: true }),
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { apiRequest } = require('../../../../src/services/api/client')
    await apiRequest('/api/health', { auth: false })

    expect(getValidToken).not.toHaveBeenCalled()
  })

  it('on 401 signs out, resets to login, and throws SESSION_EXPIRED', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const { signOut } = jest.requireMock('../../../../src/services/auth/authClient') as { signOut: jest.Mock }
    const { resetToLogin } = jest.requireMock('../../../../src/navigation/navigationRef') as { resetToLogin: jest.Mock }

    ;(global as any).fetch.mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify({ message: 'Unauthorized' }),
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { apiRequest } = require('../../../../src/services/api/client')
    await expect(apiRequest('/api/health')).rejects.toThrow('SESSION_EXPIRED')

    expect(signOut).toHaveBeenCalled()
    expect(resetToLogin).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
