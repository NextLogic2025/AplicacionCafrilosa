import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGetZones = jest.fn()
const mockGetAllRoutes = jest.fn()
const mockGetClients = jest.fn()
const mockGetBranches = jest.fn()
const mockDeactivate = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, canGoBack: () => false, goBack: jest.fn() }),
  useFocusEffect: (cb: any) => {
    const React = require('react')
    React.useEffect(() => cb(), [cb])
  },
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

jest.mock('../../../../../../src/services/api/ZoneService', () => ({
  ZoneService: {
    getZones: (...args: any[]) => mockGetZones(...args),
  },
  ZoneHelpers: {
    parsePolygon: () => [],
  },
}))

jest.mock('../../../../../../src/services/api/ClientService', () => ({
  ClientService: {
    getClients: (...args: any[]) => mockGetClients(...args),
    getClientBranches: (...args: any[]) => mockGetBranches(...args),
  },
}))

jest.mock('../../../../../../src/services/api/RouteService', () => ({
  RouteService: {
    getAll: (...args: any[]) => mockGetAllRoutes(...args),
    deactivate: (...args: any[]) => mockDeactivate(...args),
  },
}))

jest.mock('../../../../../../src/components/ui/ExpandableFab', () => ({
  ExpandableFab: ({ actions }: any) => {
    const React = require('react')
    const { View, TouchableOpacity, Text } = require('react-native')
    return (
      <View>
        {actions.map((a: any) => (
          <TouchableOpacity key={a.label} onPress={a.onPress}>
            <Text>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  },
}))

jest.mock('../../../../../../src/features/supervisor/screens/ModuloRutas/components/RoutesRouteCard', () => ({
  RoutesRouteCard: ({ item, onView, onEdit, onDeactivate }: any) => {
    const React = require('react')
    const { View, Text, TouchableOpacity } = require('react-native')
    return (
      <View>
        <Text>{item.id}</Text>
        <TouchableOpacity onPress={onView}>
          <Text>Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onEdit}>
          <Text>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDeactivate}>
          <Text>Desactivar</Text>
        </TouchableOpacity>
      </View>
    )
  },
}))

jest.mock('../../../../../../src/features/supervisor/screens/ModuloRutas/components/ZoneSelectionModal', () => ({
  ZoneSelectionModal: ({ zones, onSelect }: any) => {
    const React = require('react')
    const { View, TouchableOpacity, Text } = require('react-native')
    return (
      <View>
        {zones.map((z: any) => (
          <TouchableOpacity key={z.id} onPress={() => onSelect(z)}>
            <Text>{z.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  },
}))

jest.mock('../../../../../../src/features/supervisor/screens/ModuloRutas/components/RoutesDayMapModal', () => ({
  RoutesDayMapModal: () => null,
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SupervisorRoutesScreen } = require('../../../../../../src/features/supervisor/screens/ModuloRutas/SupervisorRoutesScreen')

describe('integration/supervisor/SupervisorRoutesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetZones.mockResolvedValue([{ id: 10, nombre: 'Zona Norte', codigo: 'ZN', activo: true }])
    mockGetClients.mockResolvedValue([
      { id: 'c1', razon_social: 'Cliente 1', nombre_comercial: 'Cliente 1', identificacion: '111', lista_precios_id: 1, bloqueado: false, tiene_credito: false, limite_credito: '0', saldo_actual: '0', dias_plazo: 0 },
    ])
    mockGetBranches.mockResolvedValue([])
    mockGetAllRoutes.mockResolvedValue([
      {
        id: 'r1',
        zona_id: 10,
        dia_semana: 1,
        activo: true,
        cliente_id: 'c1',
        frecuencia: 'SEMANAL',
        prioridad_visita: 'ALTA',
      },
    ])
    mockDeactivate.mockResolvedValue({})
  })

  it('shows routes and navigates to actions', async () => {
    const screen = render(<SupervisorRoutesScreen />)
    await waitFor(() => expect(screen.getAllByText('Zona Norte')[0]).toBeTruthy())
    await waitFor(() => expect(screen.getByText('r1')).toBeTruthy())

    fireEvent.press(screen.getByText('Ver'))
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorRouteDetail', { routeId: 'r1', mode: 'view' })

    fireEvent.press(screen.getByText('Crear ruta'))
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorRouteCreate')

    fireEvent.press(screen.getByText('Rutas desactivadas'))
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorRoutesInactive')
  })
})
