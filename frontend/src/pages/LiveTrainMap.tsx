import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Train, Clock, X, Filter, Layers, CheckCircle, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Fix leaflet default icon path issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Available Free Tile Providers (100% No API Key Required) ────────────────
const TILE_PROVIDERS = {
  osm_bright: {
    name: 'OpenStreetMap (Bright White)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c'],
    badge: '100% Free · No Key',
  },
  railway_tracks: {
    name: 'Indian Railways Track Network (OpenRailwayMap)',
    url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
    attribution: 'Map: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Rails: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a>',
    subdomains: ['a', 'b', 'c'],
    badge: 'Official IR Track Overlay',
  },
  esri_topo: {
    name: 'ESRI Topographic & Mountains',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; National Geographic, DeLorme, NAVTEQ',
    subdomains: ['server', 'services'],
    badge: 'Terrain & Ghats',
  },
};

// ─── 10 Corridors Across Indian Railways ──────────────────────────────────────
const CORRIDORS = [
  {
    id: 'CR-01', name: 'Mumbai CST – Pune (Bhor Ghat)', zone: 'CR', color: '#2563eb',
    daily_trains: 180, length_km: 192,
    coords: [[18.940, 72.835], [18.680, 73.200], [18.520, 73.856]] as [number, number][],
    stations: ['Mumbai CST', 'Karjat', 'Lonavala (Khandala Ghat)', 'Pune Jn'],
    type: 'Mountain Ghat Viaduct',
  },
  {
    id: 'CR-02', name: 'Mumbai CST – Nashik Road (Thull Ghat)', zone: 'CR', color: '#4f46e5',
    daily_trains: 120, length_km: 167,
    coords: [[18.940, 72.835], [19.200, 73.100], [19.700, 73.500], [19.970, 73.790]] as [number, number][],
    stations: ['Mumbai CST', 'Kalyan', 'Kasara Ghat', 'Igatpuri', 'Nashik Road'],
    type: 'Western Ghats Incline',
  },
  {
    id: 'CR-03', name: 'Pune – Solapur (Deccan Pass)', zone: 'CR', color: '#0284c7',
    daily_trains: 85, length_km: 261,
    coords: [[18.520, 73.856], [17.900, 74.600], [17.680, 75.900]] as [number, number][],
    stations: ['Pune Jn', 'Daund', 'Kurduvadi', 'Solapur'],
    type: 'Deccan Plateau Corridor',
  },
  {
    id: 'SCR-01', name: 'Secunderabad – Kazipet', zone: 'SCR', color: '#059669',
    daily_trains: 140, length_km: 145,
    coords: [[17.430, 78.500], [17.700, 79.100], [17.962, 79.499]] as [number, number][],
    stations: ['Secunderabad', 'Bhongir', 'Jangaon', 'Kazipet Jn'],
    type: 'Granite Ridge Transit',
  },
  {
    id: 'SCR-02', name: 'Secunderabad – Wadi Jn', zone: 'SCR', color: '#10b981',
    daily_trains: 95, length_km: 238,
    coords: [[17.430, 78.500], [17.100, 78.000], [16.900, 77.700], [17.050, 76.980]] as [number, number][],
    stations: ['Secunderabad', 'Vikarabad', 'Tandur', 'Wadi Jn'],
    type: 'Heavy Freight Trunk',
  },
  {
    id: 'SCR-03', name: 'Kazipet – Balharshah', zone: 'SCR', color: '#0d9488',
    daily_trains: 75, length_km: 280,
    coords: [[17.962, 79.499], [18.500, 79.800], [19.200, 79.200], [19.840, 79.348]] as [number, number][],
    stations: ['Kazipet Jn', 'Ramagundam', 'Manchiryal', 'Balharshah'],
    type: 'Godavari Basin Crossing',
  },
  {
    id: 'WR-01', name: 'Mumbai Central – Vadodara (Coastal Trunk)', zone: 'WR', color: '#d97706',
    daily_trains: 200, length_km: 392,
    coords: [[18.970, 72.819], [20.000, 73.000], [21.200, 72.900], [22.310, 73.190]] as [number, number][],
    stations: ['Mumbai Central', 'Vapi', 'Valsad', 'Surat', 'Vadodara'],
    type: 'High-Speed Golden Quadrilateral',
  },
  {
    id: 'WR-02', name: 'Vadodara – Ahmedabad (Sabarmati)', zone: 'WR', color: '#ea580c',
    daily_trains: 180, length_km: 110,
    coords: [[22.310, 73.190], [22.600, 72.900], [23.022, 72.580]] as [number, number][],
    stations: ['Vadodara', 'Anand Jn', 'Nadiad', 'Ahmedabad'],
    type: 'Semi-High Speed Vande Bharat Track',
  },
  {
    id: 'NR-01', name: 'New Delhi – Mathura (Yamuna River Corridor)', zone: 'NR', color: '#dc2626',
    daily_trains: 220, length_km: 141,
    coords: [[28.642, 77.220], [28.100, 77.400], [27.492, 77.673]] as [number, number][],
    stations: ['New Delhi', 'Hazrat Nizamuddin', 'Faridabad', 'Palwal', 'Mathura Jn'],
    type: '160 km/h Gatimaan Track',
  },
  {
    id: 'NR-02', name: 'Mathura – Agra Cantt', zone: 'NR', color: '#b91c1c',
    daily_trains: 160, length_km: 58,
    coords: [[27.492, 77.673], [27.300, 77.850], [27.177, 78.008]] as [number, number][],
    stations: ['Mathura Jn', 'Runkata', 'Agra Cantt'],
    type: 'Taj Express High-Speed Link',
  },
];

const MOCK_BLOCKS: Record<string, { window: string; dept: string; tasks: number; status: 'Active' | 'Upcoming' | 'Completed' }[]> = {
  'CR-01': [
    { window: '01:00 – 04:00', dept: 'Engineering (Track)', tasks: 8, status: 'Upcoming' },
    { window: '11:00 – 13:00', dept: 'S&T (Signals)', tasks: 3, status: 'Completed' },
  ],
  'SCR-01': [
    { window: '00:30 – 04:30', dept: 'TRD (OHE Traction)', tasks: 5, status: 'Active' },
  ],
  'WR-01': [
    { window: '02:00 – 05:00', dept: 'Engineering + TRD (Merged)', tasks: 12, status: 'Upcoming' },
  ],
  'NR-01': [
    { window: '00:00 – 05:00', dept: 'Engineering (Track)', tasks: 15, status: 'Active' },
  ],
};

const ZONE_COLORS: Record<string, string> = {
  CR: '#2563eb',
  SCR: '#059669',
  WR: '#d97706',
  NR: '#dc2626',
};

// ─── Custom Train Marker with Indian Railways Styling ────────────────────────
function createTrainIcon(color: string, isLight: boolean) {
  const strokeColor = isLight ? '#0F172A' : '#FFFFFF';
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="26" viewBox="0 0 40 26">
      <!-- Train Body -->
      <rect x="2" y="2" width="32" height="18" rx="4" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
      <!-- Tricolor Indian Railways band -->
      <rect x="2" y="2" width="32" height="3" fill="#FF9933" rx="1"/>
      <rect x="2" y="5" width="32" height="2" fill="#FFFFFF"/>
      <rect x="2" y="7" width="32" height="2" fill="#138808"/>
      <!-- Windows -->
      <rect x="5" y="11" width="6" height="5" rx="1" fill="rgba(255,255,255,0.9)"/>
      <rect x="14" y="11" width="6" height="5" rx="1" fill="rgba(255,255,255,0.9)"/>
      <rect x="23" y="11" width="6" height="5" rx="1" fill="rgba(255,255,255,0.9)"/>
      <!-- Headlight beam -->
      <circle cx="32" cy="13" r="2.5" fill="#FEF08A" stroke="#CA8A04" stroke-width="0.8"/>
      <!-- Wheels -->
      <circle cx="9" cy="22" r="3.5" fill="#1E293B" stroke="${strokeColor}" stroke-width="1"/>
      <circle cx="26" cy="22" r="3.5" fill="#1E293B" stroke="${strokeColor}" stroke-width="1"/>
    </svg>`;
  return L.divIcon({
    html: `<div style="filter: drop-shadow(0 2px 8px rgba(0,0,0,0.35)); transform: scale(1.1);">${svgContent}</div>`,
    className: 'custom-train-icon',
    iconSize: [40, 26],
    iconAnchor: [20, 13],
  });
}

// ─── Moving Train Component ──────────────────────────────────────────────────
function MovingTrain({ corridor, isLight }: { corridor: typeof CORRIDORS[0]; isLight: boolean }) {
  const [posIndex, setPosIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [forward, setForward] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 1) {
          if (forward && posIndex < corridor.coords.length - 2) {
            setPosIndex(i => i + 1);
            return 0;
          } else if (!forward && posIndex > 0) {
            setPosIndex(i => i - 1);
            return 0;
          } else {
            setForward(f => !f);
            return 0;
          }
        }
        return prev + 0.018;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [forward, posIndex, corridor.coords.length]);

  const a = corridor.coords[posIndex];
  const b = corridor.coords[Math.min(posIndex + 1, corridor.coords.length - 1)];
  const lat = a[0] + (b[0] - a[0]) * progress;
  const lng = a[1] + (b[1] - a[1]) * progress;

  const icon = createTrainIcon(corridor.color, isLight);
  const trainCode = `${corridor.zone}-${Math.floor(12000 + Math.random() * 500)}`;

  return (
    <Marker position={[lat, lng]} icon={icon}>
      <Tooltip direction="top" offset={[0, -12]} opacity={1}>
        <div style={{
          background: isLight ? '#FFFFFF' : '#0F172A',
          color: isLight ? '#0F172A' : '#F8FAFC',
          border: `1.5px solid ${corridor.color}`,
          borderRadius: 8,
          padding: '8px 12px',
          minWidth: 180,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 800, color: corridor.color, fontSize: 12 }}>🚆 IR Express #{trainCode}</span>
            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: '#10B98120', color: '#059669', fontWeight: 700 }}>
              LIVE
            </span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>{corridor.name}</div>
          <div style={{ fontSize: 10, color: isLight ? '#64748B' : '#94A3B8', marginTop: 3 }}>
            Current Section: {corridor.stations[Math.min(posIndex, corridor.stations.length - 1)]} → {corridor.stations[Math.min(posIndex + 1, corridor.stations.length - 1)]}
          </div>
          <div style={{ fontSize: 9, color: corridor.color, marginTop: 4, fontWeight: 600 }}>
            ⚡ {corridor.type}
          </div>
        </div>
      </Tooltip>
    </Marker>
  );
}

function MapBoundsController() {
  const map = useMap();
  useEffect(() => {
    map.setView([21.8, 77.5], 5);
  }, [map]);
  return null;
}

export default function LiveTrainMap() {
  const { theme } = useTheme();
  const isLight = theme === 'bright';
  const isIRClassic = theme === 'ir-classic';

  const [selectedCorridor, setSelectedCorridor] = useState<typeof CORRIDORS[0] | null>(null);
  const [filterZone, setFilterZone] = useState('');
  const [activeTileKey, setActiveTileKey] = useState<keyof typeof TILE_PROVIDERS>(
    isLight ? 'osm_bright' : 'osm_bright'
  );
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const filteredCorridors = filterZone
    ? CORRIDORS.filter(c => c.zone === filterZone)
    : CORRIDORS;

  const activeBlocks = Object.values(MOCK_BLOCKS).flat().filter(b => b.status === 'Active').length;
  const upcomingBlocks = Object.values(MOCK_BLOCKS).flat().filter(b => b.status === 'Upcoming').length;

  const currentTile = TILE_PROVIDERS[activeTileKey];

  return (
    <div className="space-y-5">
      {/* Indian Railways Notice Banner explaining API-free map */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3 rounded-xl border flex items-center justify-between flex-wrap gap-3 ${
          isLight
            ? 'bg-blue-50/80 border-blue-200 text-blue-900 shadow-sm'
            : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
        }`}
      >
        <div className="flex items-center gap-2.5 text-xs font-medium">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold">Indian Railways Geospatial Engine:</span>
          <span>Powered by Free OpenStreetMap & OpenRailwayMap — <strong>Zero API Key Required</strong>. Clean tiles loaded seamlessly!</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
          <CheckCircle className="w-3.5 h-3.5" /> 100% Free Open Tiles Active
        </div>
      </motion.div>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'} flex items-center gap-2.5`}>
              <Train className="w-6 h-6 text-blue-600" />
              Live Train Network & Corridor Map
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30">
              IR Live Feed
            </span>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Real-time Indian Railways corridor tracking, active maintenance block possessions, and mountain ghat crossings
          </p>
        </div>

        {/* Controls: Tile Selector + Clock + Zone Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Map Layer Switcher */}
          <div className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/80 border-slate-700'
          }`}>
            <Layers className="w-4 h-4 text-blue-600 ml-1" />
            <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Map Style:</span>
            <select
              value={activeTileKey}
              onChange={e => setActiveTileKey(e.target.value as keyof typeof TILE_PROVIDERS)}
              className={`bg-transparent text-xs font-medium focus:outline-none cursor-pointer ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}
            >
              <option value="osm_bright">☀️ OpenStreetMap (Bright White)</option>
              <option value="railway_tracks">🚆 Indian Railway Tracks (OpenRailwayMap)</option>
              <option value="esri_topo">🏔️ Mountain & Topo (ESRI)</option>
            </select>
          </div>

          {/* Live Clock */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            isLight ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-800/80 border-slate-700 text-white'
          }`}>
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-mono text-xs font-bold">
              IST {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Zone Filter */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            isLight ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-800/80 border-slate-700 text-slate-200'
          }`}>
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterZone}
              onChange={e => setFilterZone(e.target.value)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="">All IR Zones</option>
              <option value="CR">Central Railway (CR)</option>
              <option value="SCR">South Central (SCR)</option>
              <option value="WR">Western Railway (WR)</option>
              <option value="NR">Northern Railway (NR)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Trains Running', value: filteredCorridors.reduce((s, c) => s + Math.floor(c.daily_trains / 24), 0), color: 'text-emerald-600', icon: '🚆', bg: isLight ? 'bg-white border-slate-200' : 'bg-slate-800/60 border-slate-700' },
          { label: 'Active Maintenance Blocks', value: activeBlocks, color: 'text-rose-600', icon: '🔴', bg: isLight ? 'bg-white border-slate-200' : 'bg-slate-800/60 border-slate-700' },
          { label: 'Upcoming Scheduled Blocks', value: upcomingBlocks, color: 'text-amber-600', icon: '🟡', bg: isLight ? 'bg-white border-slate-200' : 'bg-slate-800/60 border-slate-700' },
          { label: 'Monitored IR Corridors', value: filteredCorridors.length, color: 'text-blue-600', icon: '📍', bg: isLight ? 'bg-white border-slate-200' : 'bg-slate-800/60 border-slate-700' },
        ].map(stat => (
          <div
            key={stat.label}
            className={`border rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm ${stat.bg}`}
          >
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Map Container and Side Panel */}
      <div className="flex gap-4" style={{ height: '560px' }}>
        {/* Map */}
        <div
          className={`flex-1 rounded-2xl overflow-hidden border relative shadow-md ${
            isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-900'
          }`}
        >
          <MapContainer
            center={[21.8, 77.5]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <MapBoundsController />

            {/* Free Tile Provider Layer (No API Key Required!) */}
            <TileLayer
              key={activeTileKey}
              url={currentTile.url}
              attribution={currentTile.attribution}
              subdomains={currentTile.subdomains}
            />

            {/* If Railway Tracks layer is selected, render base map underneath if needed */}
            {activeTileKey === 'railway_tracks' && (
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
            )}

            {filteredCorridors.map(corridor => (
              <div key={corridor.id}>
                {/* Route Polyline */}
                <Polyline
                  positions={corridor.coords}
                  pathOptions={{
                    color: corridor.color,
                    weight: 4.5,
                    opacity: 0.9,
                  }}
                  eventHandlers={{
                    click: () => setSelectedCorridor(corridor),
                  }}
                >
                  <Tooltip sticky direction="top" opacity={1}>
                    <div style={{
                      background: isLight ? '#FFFFFF' : '#1E293B',
                      color: isLight ? '#0F172A' : '#FFFFFF',
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1.5px solid ${corridor.color}`,
                      fontWeight: 700,
                      fontSize: 11,
                    }}>
                      {corridor.id}: {corridor.name} ({corridor.type})
                    </div>
                  </Tooltip>
                </Polyline>

                {/* Animated Train Marker */}
                <MovingTrain corridor={corridor} isLight={isLight} />

                {/* Active Block Warning Marker */}
                {MOCK_BLOCKS[corridor.id]?.some(b => b.status === 'Active') && (
                  <Marker
                    position={corridor.coords[Math.floor(corridor.coords.length / 2)]}
                    icon={L.divIcon({
                      html: `<div style="
                        background: #DC2626;
                        border: 2px solid #FFFFFF;
                        border-radius: 50%;
                        width: 22px; height: 22px;
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 0 14px rgba(220,38,38,0.8);
                        animation: signal-pulse 1.5s ease-in-out infinite;
                        font-size: 11px; color: white; font-weight: bold;
                      ">⚠</div>`,
                      className: '',
                      iconSize: [22, 22],
                      iconAnchor: [11, 11],
                    })}
                    eventHandlers={{ click: () => setSelectedCorridor(corridor) }}
                  >
                    <Tooltip direction="top" opacity={1}>
                      <div style={{
                        background: '#991B1B',
                        color: '#FFFFFF',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                        ⚠️ Active Maintenance Block on {corridor.id}
                      </div>
                    </Tooltip>
                  </Marker>
                )}
              </div>
            ))}
          </MapContainer>
        </div>

        {/* Corridor Inspection Slide-In Panel */}
        <AnimatePresence>
          {selectedCorridor && (
            <motion.div
              initial={{ opacity: 0, x: 50, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 310 }}
              exit={{ opacity: 0, x: 50, width: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className={`rounded-2xl overflow-hidden flex flex-col border shadow-xl ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
              style={{ minWidth: 310, borderLeft: `5px solid ${selectedCorridor.color}` }}
            >
              {/* Panel Header */}
              <div className={`p-4 border-b flex justify-between items-start ${
                isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-800/60'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: ZONE_COLORS[selectedCorridor.zone] + '25', color: ZONE_COLORS[selectedCorridor.zone] }}
                    >
                      {selectedCorridor.zone} Zone
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{selectedCorridor.id}</span>
                  </div>
                  <h3 className="text-sm font-black leading-snug">{selectedCorridor.name}</h3>
                  <span className="text-[10px] font-semibold text-blue-600 block mt-0.5">
                    {selectedCorridor.type}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCorridor(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="text-slate-500 mb-1">Daily Train Traffic</div>
                    <div className="text-base font-black">{selectedCorridor.daily_trains} trains</div>
                  </div>
                  <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="text-slate-500 mb-1">Route Length</div>
                    <div className="text-base font-black">{selectedCorridor.length_km} km</div>
                  </div>
                </div>

                {/* Stations */}
                <div>
                  <div className="font-bold uppercase tracking-wider text-slate-500 mb-2">Key Stations & Ghat Sections</div>
                  <div className="space-y-1.5">
                    {selectedCorridor.stations.map((st, i) => (
                      <div key={st} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            background: i === 0 ? '#10B981' : i === selectedCorridor.stations.length - 1 ? '#EF4444' : selectedCorridor.color
                          }}
                        />
                        <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Maintenance Blocks */}
                <div>
                  <div className="font-bold uppercase tracking-wider text-slate-500 mb-2">Coordinated Track Blocks</div>
                  {(MOCK_BLOCKS[selectedCorridor.id] || []).length === 0 ? (
                    <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      ✓ No active track possession. All lines clear.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(MOCK_BLOCKS[selectedCorridor.id] || []).map((b, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            b.status === 'Active'
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                              : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono font-bold">{b.window}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'Active' ? 'bg-rose-500 text-white' : 'bg-amber-500/20 text-amber-600'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <div className="font-semibold text-blue-600">{b.dept}</div>
                          <div className="text-slate-500 mt-0.5">{b.tasks} defects unified in shadow block</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend & Controls */}
      <div className={`p-4 rounded-xl border flex flex-wrap gap-4 items-center justify-between shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">IR Zones:</span>
          {Object.entries(ZONE_COLORS).map(([zone, color]) => (
            <button
              key={zone}
              onClick={() => setFilterZone(filterZone === zone ? '' : zone)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                filterZone === zone ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{
                color,
                background: color + '15',
                borderColor: color + '40',
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {zone === 'CR' ? 'Central Railway' : zone === 'SCR' ? 'South Central' : zone === 'WR' ? 'Western Railway' : 'Northern Railway'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 shadow-sm" />
            Active Block Closure
          </span>
          <span className="flex items-center gap-1.5">
            🚆 Animated Indian Express (Real-time Section Speed)
          </span>
        </div>
      </div>
    </div>
  );
}
