jest.mock('../../../../src/services/api/client', () => ({
  apiRequest: jest.fn(),
}))

describe('services/api/AssignmentService', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('getAssignmentsByZone filters by zona_id', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AssignmentService } = require('../../../../src/services/api/AssignmentService')
    jest.spyOn(AssignmentService, 'getAllAssignments').mockResolvedValueOnce([
      { id: 1, zona_id: 10 } as any,
      { id: 2, zona_id: 11 } as any,
      { id: 3, zona_id: 10 } as any,
    ])

    const res = await AssignmentService.getAssignmentsByZone(10)
    expect(res.map((a: any) => a.id)).toEqual([1, 3])
  })

  it('assignVendor builds payload with defaults', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-16T12:00:00.000Z'))

    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValueOnce({})

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AssignmentService } = require('../../../../src/services/api/AssignmentService')
    const res = await AssignmentService.assignVendor({ zona_id: 5, vendedor_usuario_id: 123 as any })

    expect(res).toEqual({ success: true, message: 'Vendedor asignado exitosamente' })

    const call = apiRequest.mock.calls[0]
    expect(call[0]).toBe('/api/asignacion')
    expect(call[1].method).toBe('POST')
    const payload = JSON.parse(call[1].body)
    expect(payload).toMatchObject({
      zona_id: 5,
      vendedor_usuario_id: '123',
      es_principal: true,
      fecha_inicio: '2026-01-16',
      nombre_vendedor_cache: null,
    })

    jest.useRealTimers()
  })

  it('updateAssignment sends PUT to asignacionById', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValueOnce({})

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AssignmentService } = require('../../../../src/services/api/AssignmentService')
    const res = await AssignmentService.updateAssignment(7, { zona_id: 1, vendedor_usuario_id: 'u1', es_principal: false })

    expect(res.success).toBe(true)
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/asignacion/7',
      expect.objectContaining({ method: 'PUT', body: expect.any(String) })
    )
  })
})

