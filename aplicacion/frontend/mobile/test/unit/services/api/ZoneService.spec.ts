import { ZoneHelpers } from '../../../../src/services/api/ZoneService'

describe('services/api/ZoneService ZoneHelpers', () => {
  it('parsePolygon accepts GeoJSON polygon coordinates and removes closing point', () => {
    const coords = ZoneHelpers.parsePolygon({
      type: 'Polygon',
      coordinates: [
        [
          [-79.9, -2.1],
          [-79.8, -2.1],
          [-79.8, -2.0],
          [-79.9, -2.1],
        ],
      ],
    })

    expect(coords).toEqual([
      { longitude: -79.9, latitude: -2.1 },
      { longitude: -79.8, latitude: -2.1 },
      { longitude: -79.8, latitude: -2.0 },
    ])
  })

  it('toGeoJson closes polygon when needed', () => {
    const geo = ZoneHelpers.toGeoJson([
      { latitude: 1, longitude: 2 },
      { latitude: 1, longitude: 3 },
      { latitude: 2, longitude: 3 },
    ])

    expect(geo).toEqual({
      type: 'Polygon',
      coordinates: [
        [
          [2, 1],
          [3, 1],
          [3, 2],
          [2, 1],
        ],
      ],
    })
  })
})

