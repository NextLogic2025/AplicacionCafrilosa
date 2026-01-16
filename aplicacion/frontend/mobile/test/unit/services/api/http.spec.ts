describe('services/api/http', () => {
  beforeEach(() => {
    jest.resetModules()
    ;(global as any).fetch = jest.fn()
  })

  it('throws when EXPO_PUBLIC_API_BASE_URL is missing', async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { http } = require('../../../../src/services/api/http')
    await expect(http('/x', { auth: false })).rejects.toThrow('API base URL no configurada')
  })

  it('returns undefined for 204', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:1234'
    ;(global as any).fetch.mockResolvedValue({
      ok: true,
      status: 204,
      headers: { get: () => null },
      text: async () => '',
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { http } = require('../../../../src/services/api/http')
    await expect(http('/x', { auth: false })).resolves.toBeUndefined()
  })

  it('throws ApiError when response is not ok', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:1234'
    ;(global as any).fetch.mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify({ message: 'boom' }),
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { http } = require('../../../../src/services/api/http')
    await expect(http('/x', { auth: false })).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
    })
  })
})
