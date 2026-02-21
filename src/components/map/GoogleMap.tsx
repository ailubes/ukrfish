'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap, TileLayer, CircleMarker, Popup } from 'leaflet'

export interface GoogleMapItem {
  id: string
  title: string
  lat: number
  lng: number
  color?: string
  infoHtml?: string
}

interface GoogleMapProps {
  items: GoogleMapItem[]
  className?: string
  onMarkerClick?: (id: string) => void
  selectedId?: string | null
}

interface MarkerEntry {
  id: string
  marker: CircleMarker
  popup: Popup
}

function createLeafletStyles() {
  if (document.getElementById('leaflet-inline-css')) {
    return
  }
  const style = document.createElement('style')
  style.id = 'leaflet-inline-css'
  style.textContent = `
    .leaflet-container { height: 100%; width: 100%; }
    .leaflet-control-attribution { font-size: 10px; }
  `
  document.head.appendChild(style)
}

export default function GoogleMap({ items, className = '', onMarkerClick, selectedId }: GoogleMapProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const tileLayerRef = useRef<TileLayer | null>(null)
  const markersRef = useRef<MarkerEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        createLeafletStyles()
        const L = await import('leaflet')
        if (cancelled || !mapNodeRef.current) {
          return
        }

        const container = mapNodeRef.current as HTMLDivElement & { _leaflet_id?: number }
        if (container._leaflet_id) {
          container._leaflet_id = undefined
        }

        const map = L.map(container, {
          center: [49, 32],
          zoom: 6,
          zoomControl: true,
          attributionControl: true,
        })

        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        })

        tileLayer.addTo(map)
        mapRef.current = map
        tileLayerRef.current = tileLayer
        window.setTimeout(() => {
          map.invalidateSize()
        }, 0)

        const onResize = () => map.invalidateSize()
        window.addEventListener('resize', onResize)

        ;(map as LeafletMap & { __resizeHandler?: () => void }).__resizeHandler = onResize
        setIsLoaded(true)
      } catch {
        if (!cancelled) {
          setLoadError('Помилка завантаження OpenStreetMap')
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
      markersRef.current.forEach(({ marker, popup }) => {
        marker.remove()
        popup.remove()
      })
      markersRef.current = []
      tileLayerRef.current?.remove()
      tileLayerRef.current = null
      const resizeHandler = (mapRef.current as LeafletMap & { __resizeHandler?: () => void } | null)?.__resizeHandler
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
      }
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const renderMarkers = async () => {
      if (!isLoaded || !mapRef.current) {
        return
      }

      const L = await import('leaflet')

      markersRef.current.forEach(({ marker, popup }) => {
        marker.remove()
        popup.remove()
      })
      markersRef.current = []

      const map = mapRef.current
      const bounds = L.latLngBounds([])

      items.forEach((item) => {
        const marker = L.circleMarker([item.lat, item.lng], {
          radius: selectedId === item.id ? 8 : 6,
          color: item.color || '#1e40af',
          fillColor: item.color || '#1e40af',
          fillOpacity: 0.85,
          weight: 2,
        })

        const popup = L.popup({ closeButton: true, offset: [0, -6] }).setContent(
          item.infoHtml || `<div style="padding:8px;"><strong>${item.title}</strong></div>`,
        )

        marker.bindPopup(popup)
        marker.on('click', () => {
          if (onMarkerClick) {
            onMarkerClick(item.id)
          }
        })

        marker.addTo(map)
        bounds.extend([item.lat, item.lng])
        markersRef.current.push({ id: item.id, marker, popup })
      })

      if (items.length === 1) {
        map.setView([items[0].lat, items[0].lng], 10)
      } else if (items.length > 1) {
        map.fitBounds(bounds, { padding: [24, 24] })
      }
    }

    void renderMarkers()
  }, [isLoaded, items, onMarkerClick, selectedId])

  useEffect(() => {
    if (!selectedId || !mapRef.current) {
      return
    }
    const selected = markersRef.current.find((entry) => entry.id === selectedId)
    if (!selected) {
      return
    }
    const position = selected.marker.getLatLng()
    mapRef.current.panTo(position)
    selected.marker.openPopup()
  }, [selectedId, items])

  return (
    <div className={`w-full h-full relative ${className}`}>
      <div ref={mapNodeRef} className="w-full h-full" />
      {loadError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600">{loadError}</div>
      ) : null}
      {!isLoaded && !loadError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50 text-blue-700">Завантаження мапи...</div>
      ) : null}
    </div>
  )
}
