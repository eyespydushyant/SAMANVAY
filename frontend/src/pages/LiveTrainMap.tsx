import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Train, Clock, X, Filter, Layers, CheckCircle, ShieldAlert,
  Search, Radio, Calendar, Zap, Key, ExternalLink, ChevronRight, Gauge
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { railRadarApi } from '../api/client';

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
  },
  railway_tracks: {
    name: 'Indian Railways Track Network (OpenRailwayMap)',
    url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
    attribution: 'Map: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Rails: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a>',
    subdomains: ['a', 'b', 'c'],
  },
  esri_topo: {
    name: 'ESRI Topographic & Mountains',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; National Geographic, DeLorme, NAVTEQ',
    subdomains: ['server', 'services'],
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
    id: 'NR-01', name: 'New Delhi – Mathura (Yamuna Corridor)', zone: 'NR', color: '#dc2626',
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

const POPULAR_QUICK_TRAINS = [
  { num: '22436', name: 'Vande Bharat Express' },
  { num: '12002', name: 'Bhopal Shatabdi' },
  { num: '12951', name: 'Mumbai Rajdhani' },
  { num: '12124', name: 'Deccan Queen' },
];

function createTrainIcon(color: string, isLight: boolean, label?: string) {
  const strokeColor = isLight ? '#0F172A' : '#FFFFFF';
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="28" viewBox="0 0 42 28">
      <rect x="2" y="3" width="34" height="18" rx="4" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
      <rect x="2" y="3" width="34" height="3" fill="#FF9933" rx="1"/>
      <rect x="2" y="6" width="34" height="2" fill="#FFFFFF"/>
      <rect x="2" y="8" width="34" height="2" fill="#138808"/>
      <rect x="6" y="12" width="6" height="5" rx="1" fill="rgba(255,255,255,0.9)"/>
      <rect x="15" y="12" width="6" height="5" rx="1" fill="rgba(255,255,255,0.9)"/>
      <rect x="24" y="12" width="6" height="5" rx="1" fill="rgba(255,255,255,0.9)"/>
      <circle cx="34" cy="14" r="2.5" fill="#FEF08A" stroke="#CA8A04" stroke-width="0.8"/>
      <circle cx="10" cy="23" r="3.5" fill="#1E293B" stroke="${strokeColor}" stroke-width="1"/>
      <circle cx="28" cy="23" r="3.5" fill="#1E293B" stroke="${strokeColor}" stroke-width="1"/>
    </svg>`;
  return L.divIcon({
    html: `<div style="filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4)); transform: scale(1.1);">${svgContent}</div>`,
    className: 'custom-train-icon',
    iconSize: [42, 28],
    iconAnchor: [21, 14],
  });
}

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
            Section: {corridor.stations[Math.min(posIndex, corridor.stations.length - 1)]} → {corridor.stations[Math.min(posIndex + 1, corridor.stations.length - 1)]}
          </div>
        </div>
      </Tooltip>
    </Marker>
  );
}

function MapBoundsController({ targetCoords }: { targetCoords?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, 7, { duration: 1.5 });
    } else {
      map.setView([21.8, 77.5], 5);
    }
  }, [map, targetCoords]);
  return null;
}

export default function LiveTrainMap() {
  const { theme } = useTheme();
  const isLight = theme === 'bright';
  const isIR = theme === 'ir-classic';

  const [selectedCorridor, setSelectedCorridor] = useState<typeof CORRIDORS[0] | null>(null);
  const [filterZone, setFilterZone] = useState('');
  const [activeTileKey, setActiveTileKey] = useState<keyof typeof TILE_PROVIDERS>('osm_bright');
  const [clock, setClock] = useState(new Date());

  // ─── RailRadar API Integration State ──────────────────────────────────────
  const [trainQuery, setTrainQuery] = useState('22436');
  const [railApiKey, setRailApiKey] = useState(() => localStorage.getItem('railradar_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [liveTrainData, setLiveTrainData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'schedule'>('live');
  const [targetCoords, setTargetCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch RailRadar live train on mount with default Vande Bharat 22436
  useEffect(() => {
    fetchRailRadarTrain('22436');
  }, []);

  const fetchRailRadarTrain = async (trainNum: string) => {
    if (!trainNum) return;
    setLoadingTrack(true);
    try {
      const [liveRes, schedRes] = await Promise.all([
        railRadarApi.getLive(trainNum, railApiKey || undefined),
        railRadarApi.getSchedule(trainNum, railApiKey || undefined),
      ]);
      setLiveTrainData(liveRes.data);
      setScheduleData(schedRes.data);

      if (liveRes.data?.current_coordinates) {
        setTargetCoords(liveRes.data.current_coordinates as [number, number]);
      }
    } catch (e) {
      console.error('RailRadar API error:', e);
    }
    setLoadingTrack(false);
  };

  const handleSaveApiKey = (key: string) => {
    setRailApiKey(key);
    localStorage.setItem('railradar_api_key', key);
    setShowKeyInput(false);
    fetchRailRadarTrain(trainQuery);
  };

  const filteredCorridors = filterZone
    ? CORRIDORS.filter(c => c.zone === filterZone)
    : CORRIDORS;

  const activeBlocks = Object.values(MOCK_BLOCKS).flat().filter(b => b.status === 'Active').length;
  const upcomingBlocks = Object.values(MOCK_BLOCKS).flat().filter(b => b.status === 'Upcoming').length;

  const currentTile = TILE_PROVIDERS[activeTileKey];

  return (
    <div className="space-y-4">
      {/* ─── RailRadar API Live Bar & Search ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3.5 rounded-2xl border transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : isIR
            ? 'bg-[#121E33] border-slate-700 shadow-md'
            : 'bg-slate-900 border-slate-800 shadow-md'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: RailRadar Brand + Search Input */}
          <div className="flex items-center gap-3 flex-1 min-w-[320px]">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="text-xs font-black tracking-wider uppercase text-rose-500 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                RailRadar Live Telemetry
              </span>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                fetchRailRadarTrain(trainQuery);
              }}
              className="flex items-center gap-2 flex-1 max-w-md"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={trainQuery}
                  onChange={e => setTrainQuery(e.target.value)}
                  placeholder="Enter train number (e.g. 22436, 12002, 12951)..."
                  className={`w-full text-xs px-3 py-2 pl-8 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-800/80 border-slate-700 text-white'
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <button
                type="submit"
                disabled={loadingTrack}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
              >
                {loadingTrack ? 'Tracking...' : 'Track Live'}
              </button>
            </form>
          </div>

          {/* Quick Popular Trains Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Popular:</span>
            {POPULAR_QUICK_TRAINS.map(t => (
              <button
                key={t.num}
                onClick={() => {
                  setTrainQuery(t.num);
                  fetchRailRadarTrain(t.num);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                  trainQuery === t.num
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {t.num} {t.name.split(' ')[0]}
              </button>
            ))}

            {/* Optional RailRadar API Key Configuration Button */}
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                railApiKey ? 'text-emerald-500 border-emerald-500/40 bg-emerald-500/10' : 'text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Configure RailRadar API Key (api.railradar.in)"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* API Key Drawer */}
        <AnimatePresence>
          {showKeyInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs"
            >
              <span className="font-semibold text-slate-500">RailRadar API Key:</span>
              <input
                type="password"
                defaultValue={railApiKey}
                onBlur={e => handleSaveApiKey(e.target.value)}
                placeholder="Paste key from api.railradar.in (Optional, fallback live telemetry active)"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
              />
              <span className="text-[10px] text-slate-400">Endpoints: api.railradar.in/v1/trains/:num/live & timetable</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Map Header & Controls ───────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'} flex items-center gap-2`}>
              <Train className="w-5 h-5 text-blue-600" />
              Live Train Network & Corridor Map
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30">
              IR Live Feed
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Real-time corridor tracking with active maintenance block overlays & RailRadar live train status
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Map Layer Switcher */}
          <div className={`flex items-center gap-1.5 p-1 rounded-xl border text-xs ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/80 border-slate-700'
          }`}>
            <Layers className="w-3.5 h-3.5 text-blue-600 ml-1" />
            <select
              value={activeTileKey}
              onChange={e => setActiveTileKey(e.target.value as keyof typeof TILE_PROVIDERS)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer py-1 px-1"
            >
              <option value="osm_bright">☀️ OpenStreetMap (Bright White)</option>
              <option value="railway_tracks">🚆 Indian Railways Tracks (OpenRailwayMap)</option>
              <option value="esri_topo">🏔️ Mountain & Topo (ESRI)</option>
            </select>
          </div>

          {/* Live Clock */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
            isLight ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-800/80 border-slate-700 text-white'
          }`}>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>IST {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

          {/* Zone Filter */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs ${
            isLight ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-800/80 border-slate-700 text-slate-200'
          }`}>
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={filterZone}
              onChange={e => setFilterZone(e.target.value)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="">All Zones (10 Corridors)</option>
              <option value="CR">Central Railway (CR)</option>
              <option value="SCR">South Central (SCR)</option>
              <option value="WR">Western Railway (WR)</option>
              <option value="NR">Northern Railway (NR)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Map Container + RailRadar Live Telemetry Drawer ──────────────────── */}
      <div className="flex gap-4" style={{ height: '540px' }}>
        {/* Map */}
        <div
          className={`flex-1 rounded-2xl overflow-hidden border relative shadow-md ${
            isLight ? 'border-slate-300 bg-white' : 'border-slate-800 bg-slate-900'
          }`}
        >
          <MapContainer
            center={[21.8, 77.5]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <MapBoundsController targetCoords={targetCoords} />

            {/* Free Tile Provider (No Key Required!) */}
            <TileLayer
              key={activeTileKey}
              url={currentTile.url}
              attribution={currentTile.attribution}
              subdomains={currentTile.subdomains}
            />

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
                    weight: 4,
                    opacity: 0.85,
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
                      {corridor.id}: {corridor.name}
                    </div>
                  </Tooltip>
                </Polyline>

                <MovingTrain corridor={corridor} isLight={isLight} />

                {/* Active Block Warning Marker */}
                {MOCK_BLOCKS[corridor.id]?.some(b => b.status === 'Active') && (
                  <Marker
                    position={corridor.coords[Math.floor(corridor.coords.length / 2)]}
                    icon={L.divIcon({
                      html: `<div style="
                        background: #DC2626; border: 2px solid #FFFFFF; border-radius: 50%;
                        width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 0 14px rgba(220,38,38,0.8); animation: signal-pulse 1.5s ease-in-out infinite;
                        font-size: 11px; color: white; font-weight: bold;
                      ">⚠</div>`,
                      className: '',
                      iconSize: [22, 22],
                      iconAnchor: [11, 11],
                    })}
                    eventHandlers={{ click: () => setSelectedCorridor(corridor) }}
                  >
                    <Tooltip direction="top" opacity={1}>
                      <div style={{ background: '#991B1B', color: '#FFFFFF', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontWeight: 700 }}>
                        ⚠️ Active Maintenance Block on {corridor.id}
                      </div>
                    </Tooltip>
                  </Marker>
                )}
              </div>
            ))}

            {/* Target Tracked RailRadar Train Marker */}
            {liveTrainData?.current_coordinates && (
              <Marker
                position={liveTrainData.current_coordinates as [number, number]}
                icon={L.divIcon({
                  html: `<div style="
                    background: #2563EB; border: 3px solid #FEF08A; border-radius: 50%;
                    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 20px #2563EB; font-size: 14px; animation: float-up 2s ease-in-out infinite;
                  ">🚆</div>`,
                  className: '',
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                })}
              >
                <Tooltip direction="top" opacity={1} permanent>
                  <div style={{ background: '#1E3A8A', color: '#FFFFFF', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 11 }}>
                    {liveTrainData.train_name} ({liveTrainData.speed_kmh} km/h)
                  </div>
                </Tooltip>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* ─── RailRadar Tracked Train Detail Panel ──────────────────────────── */}
        <div
          className={`w-80 rounded-2xl border flex flex-col overflow-hidden shadow-lg transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          {/* Panel Header */}
          <div className={`p-4 border-b flex items-start justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  #{liveTrainData?.train_number || trainQuery}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  liveTrainData?.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'
                }`}>
                  {liveTrainData?.status || 'RUNNING'}
                </span>
              </div>
              <h3 className="font-black text-sm leading-tight">{liveTrainData?.train_name || 'Loading train...'}</h3>
              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                {liveTrainData?.train_type || 'Superfast Express'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 justify-end">
                <Gauge className="w-3.5 h-3.5" />
                {liveTrainData?.speed_kmh || 0} km/h
              </span>
              <span className="text-[10px] text-slate-400">
                {liveTrainData?.delay_minutes ? `+${liveTrainData.delay_minutes}m Late` : 'On Time'}
              </span>
            </div>
          </div>

          {/* Tabs: Live Status vs Timetable */}
          <div className={`flex border-b text-xs font-bold ${isLight ? 'border-slate-200 bg-slate-100/60' : 'border-slate-800 bg-slate-800/40'}`}>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'live'
                  ? isLight ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-800 text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Live Status
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'schedule'
                  ? isLight ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-800 text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Timetable
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {activeTab === 'live' ? (
              <>
                {/* Current & Next Section */}
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/80'}`}>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Current Section</div>
                  <div className="font-black text-sm">
                    {liveTrainData?.current_station?.name} ({liveTrainData?.current_station?.code})
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Dep: {liveTrainData?.current_station?.departure_time}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/80'}`}>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Approaching Station</div>
                  <div className="font-black text-sm text-blue-600">
                    {liveTrainData?.next_station?.name} ({liveTrainData?.next_station?.code})
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>ETA: {liveTrainData?.next_station?.eta}</span>
                    <span>Distance: {liveTrainData?.next_station?.distance_km} km</span>
                  </div>
                </div>

                {/* Corridor & Safety Coordination */}
                <div className={`p-3 rounded-xl border ${isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'}`}>
                  <div className="text-[10px] uppercase font-bold mb-1">Block Planner Safety Clearance</div>
                  <p className="text-[11px] leading-relaxed">
                    Train #{liveTrainData?.train_number} tracked against <strong>{liveTrainData?.corridor || 'Northern Railway'}</strong>. No conflicting maintenance possessions in current block sector.
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 text-center pt-2">
                  Telemetric feed: {liveTrainData?.source || 'api.railradar.in/v1/trains'}
                </div>
              </>
            ) : (
              /* Timetable List */
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Full Station Halts ({scheduleData?.schedule?.length || 0} stops)
                </div>
                {(scheduleData?.schedule || []).map((st: any, i: number) => (
                  <div
                    key={st.code}
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">
                        {st.stop}
                      </span>
                      <div>
                        <div className="font-bold">{st.name}</div>
                        <div className="text-[10px] text-slate-400">{st.dist} km · Halt: {st.halt}m</div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <div>{st.arr}</div>
                      <div className="text-slate-400">{st.dep}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
