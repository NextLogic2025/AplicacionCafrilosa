import type { LatLng, Zone } from '../../../../services/api/ZoneService'

export interface ZoneWithVendor extends Zone {
    vendorName?: string | null
}

export type SupervisorZoneStackParamList = {
    SupervisorZones: undefined
    SupervisorZoneDetail: { zone: ZoneWithVendor }
    SupervisorZoneForm: { zone?: Zone | null }
    SupervisorZoneMap: { mode?: 'view' | 'edit'; centerHint?: LatLng }
}
