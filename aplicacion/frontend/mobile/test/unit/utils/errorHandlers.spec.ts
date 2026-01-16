import { ApiError } from '../../../src/services/api/ApiError'
import { handleApiError, isSessionExpiredError } from '../../../src/utils/errorHandlers'

describe('utils/errorHandlers', () => {
  it('maps ApiError 0 to connection message', () => {
    const res = handleApiError(new ApiError('Network request failed', 0))
    expect(res.type).toBe('error')
    expect(res.title).toMatch(/conex/i)
  })

  it('maps ApiError 401 to session expired', () => {
    const res = handleApiError(new ApiError('Unauthorized', 401))
    expect(res.type).toBe('warning')
    expect(res.title).toMatch(/expir/i)
  })

  it('detects SESSION_EXPIRED error', () => {
    expect(isSessionExpiredError(new Error('SESSION_EXPIRED'))).toBe(true)
  })
})
