'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './LocationMap.module.css'

const PROJECT_LOCATIONS = [
    {
        name: 'Lomas del Mar',
        lat: -33.4617574,
        lng: -71.6158903,
        color: '#76d845',
        textColor: '#0e1a24',
        mapsUrl: 'https://maps.app.goo.gl/gvsmU1zsa2phRiUD7',
    },
    {
        name: 'Arena y Sol',
        lat: -33.4347434,
        lng: -71.6290669,
        color: '#ffffff',
        textColor: '#0e1a24',
        mapsUrl: 'https://maps.app.goo.gl/h7gaaTCV1J4F2zCAA',
    },
] as const

export default function LocationMap() {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<LeafletMap | null>(null)

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return

        let cancelled = false

        import('leaflet').then((L) => {
            if (cancelled || !containerRef.current || mapRef.current) return

            const map = L.map(containerRef.current, {
                scrollWheelZoom: false,
                zoomControl: true,
                attributionControl: false,
            }).setView([-33.448, -71.622], 13)

            L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                {
                    maxZoom: 19,
                    attribution: 'Imagery &copy; Esri',
                }
            ).addTo(map)

            const bounds = L.latLngBounds(PROJECT_LOCATIONS.map((p) => [p.lat, p.lng]))

            PROJECT_LOCATIONS.forEach((project) => {
                const icon = L.divIcon({
                    className: styles.markerIcon,
                    html: `
                        <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-100%)">
                            <span style="background:${project.color};color:${project.textColor};font:700 11px 'Montserrat',sans-serif;padding:4px 10px;border-radius:100px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.4);margin-bottom:4px">${project.name}</span>
                            <span style="width:16px;height:16px;border-radius:50% 50% 50% 0;background:${project.color};transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.5);border:2px solid #0e1a24"></span>
                        </div>
                    `,
                    iconSize: [0, 0],
                })

                L.marker([project.lat, project.lng], { icon })
                    .addTo(map)
                    .bindPopup(
                        `<div style="font:700 13px 'Montserrat',sans-serif;margin-bottom:6px">${project.name}</div>
                         <a href="${project.mapsUrl}" target="_blank" rel="noopener noreferrer" style="font:600 12px 'Roboto',sans-serif;color:#4ba646;text-decoration:none">Ver en Google Maps →</a>`
                    )
            })

            map.fitBounds(bounds, { padding: [60, 60] })

            const onDblClick = () => map.scrollWheelZoom.enable()
            map.on('click', () => map.scrollWheelZoom.disable())
            containerRef.current.addEventListener('mouseenter', () => map.scrollWheelZoom.enable())
            containerRef.current.addEventListener('mouseleave', () => map.scrollWheelZoom.disable())
            map.on('dblclick', onDblClick)

            mapRef.current = map
        })

        return () => {
            cancelled = true
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [])

    return (
        <div className={styles.mapFrame}>
            <div ref={containerRef} className={styles.mapContainer} />
            <div className={styles.mapBadge}>🛰 Vista satelital · Imagery © Esri</div>
        </div>
    )
}
