import React, { useEffect } from 'react'
import { Marker, useGoogleMap } from '@react-google-maps/api'

type AdvancedMarkerProps = {
  position: google.maps.LatLngLiteral
  title?: string
  icon?: string | google.maps.Icon | google.maps.Symbol
  animation?: any
  // children could be used to render custom content for AdvancedMarkerElement in future
}

export default function AdvancedMarker({ position, title, icon }: AdvancedMarkerProps) {
  const map = useGoogleMap()

  useEffect(() => {
    const g = (window as any).google
    if (!g || !g.maps) return

    const Advanced = g.maps.marker && g.maps.marker.AdvancedMarkerElement
    if (!Advanced) return

    const opts: any = { position, map }
    if (title) opts.title = title
    if (icon) opts.icon = typeof icon === 'string' ? { url: icon } : icon

    const marker = new Advanced(opts)
    return () => {
      try {
        marker.setMap(null)
      } catch {
        // ignore
      }
    }
  }, [map, position, title, icon])

  // Fallback to standard Marker when AdvancedMarkerElement is not available
  const g = (typeof window !== 'undefined' ? (window as any).google : undefined)
  const hasAdvanced = Boolean(g && g.maps && g.maps.marker && g.maps.marker.AdvancedMarkerElement)
  if (!hasAdvanced) {
    return <Marker position={position} title={title} icon={typeof icon === 'string' ? { url: icon } : icon} />
  }

  return null
}
