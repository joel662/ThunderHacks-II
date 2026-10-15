import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { BRAMPTON_CENTER, CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, type Report } from '@/types';

function createMarkerIcon(category: string, isSelected: boolean) {
  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#8b5cf6';
  const size = isSelected ? 48 : 40;
  const border = isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.5)';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: ${border};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isSelected ? 22 : 18}px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      transition: all 0.2s;
    ">${CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '📋'}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyToSelected({ report }: { report: Report | null }) {
  const map = useMap();
  useEffect(() => {
    if (report) {
      map.flyTo([report.location.latitude, report.location.longitude], 16, { duration: 0.8 });
    }
  }, [report, map]);
  return null;
}

function AlwaysLightTileLayer() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
}

interface MapViewProps {
  reports: Report[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MapView({ reports, selectedId, onSelect }: MapViewProps) {
  const navigate = useNavigate();
  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedId) || null,
    [reports, selectedId]
  );

  return (
    <MapContainer
      center={[BRAMPTON_CENTER.latitude, BRAMPTON_CENTER.longitude]}
      zoom={13}
      className="h-full w-full rounded-xl"
      zoomControl={true}
    >
      <AlwaysLightTileLayer />
      <FlyToSelected report={selectedReport} />
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
        zoomToBoundsOnClick
        iconCreateFunction={(cluster: any) => {
          const count = cluster.getChildCount();
          const size = count < 10 ? 40 : count < 50 ? 48 : 56;
          return L.divIcon({
            html: `<div style="
              width: ${size}px;
              height: ${size}px;
              background: #e94560;
              border: 3px solid #fff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-weight: 700;
              font-size: 14px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            ">${count}</div>`,
            className: '',
            iconSize: L.point(size, size),
            iconAnchor: L.point(size / 2, size / 2),
          });
        }}
      >
        {reports.map((r) => (
          <Marker
            key={r.id}
            position={[r.location.latitude, r.location.longitude]}
            icon={createMarkerIcon(r.category, r.id === selectedId)}
            eventHandlers={{
              click: () => onSelect(r.id),
            }}
          >
            <Popup>
              <div style={{ minWidth: 180, color: 'var(--text)' }}>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{r.title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{CATEGORY_LABELS[r.category]}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{r.location.address}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11 }}>👍 {r.upvoteCount} &middot; 💬 {r.commentCount}</span>
                  <StatusBadge status={r.status} />
                </div>
                <button
                  onClick={() => navigate(`/reports/${r.id}`)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: '#e94560',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
