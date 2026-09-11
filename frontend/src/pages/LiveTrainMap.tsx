import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Train, AlertTriangle, Activity, Clock, ChevronRight, X, Filter } from 'lucide-react';

// Fix leaflet default icon path issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Corridor Data ───────────────────────────────────────────────────────────
const CORRIDORS = [
  {
    id: 'CR-01', name: 'Mumbai CST – Pune', zone: 'CR', color: '#6366f1',
    daily_trains: 180, length_km: 192,
    coords: [[18.940, 72.835], [18.680, 73.200], [18.520, 73.856]] as [number, number][],
    stations: ['Mumbai CST', 'Karjat', 'Pune Jn'],
  },
  {
    id: 'CR-02', name: 'Mumbai CST – Nashik Road', zone: 'CR', color: '#818cf8',
    daily_trains: 120, length_km: 167,
    coords: [[18.940, 72.835], [19.200, 73.100], [19.970, 73.790]] as [number, number][],
    stations: ['Mumbai CST', 'Kasara', 'Nashik Road'],
  },
  {
    id: 'CR-03', name: 'Pune – Solapur', zone: 'CR', color: '#a5b4fc',
    daily_trains: 85, length_km: 261,
    coords: [[18.520, 73.856], [17.900, 74.600], [17.680, 75.900]] as [number, number][],
    stations: ['Pune Jn', 'Daund', 'Solapur'],
  },
  {
    id: 'SCR-01', name: 'Secunderabad – Kazipet', zone: 'SCR', color: '#10b981',
    daily_trains: 140, length_km: 145,
    coords: [[17.430, 78.500], [17.700, 79.100], [17.962, 79.499]] as [number, number][],
    stations: ['Secunderabad', 'Bhongir', 'Kazipet Jn'],
  },
  {
    id: 'SCR-02', name: 'Secunderabad – Wadi', zone: 'SCR', color: '#34d399',
    daily_trains: 95, length_km: 238,
    coords: [[17.430, 78.500], [17.100, 78.000], [16.900, 77.700], [17.050, 76.980]] as [number, number][],
    stations: ['Secunderabad', 'Nanded', 'Wadi'],
  },
  {
    id: 'SCR-03', name: 'Kazipet – Balharshah', zone: 'SCR', color: '#6ee7b7',
    daily_trains: 75, length_km: 280,
    coords: [[17.962, 79.499], [18.500, 79.800], [19.200, 79.200], [19.840, 79.348]] as [number, number][],
    stations: ['Kazipet Jn', 'Manchiryal', 'Balharshah'],
  },
  {
    id: 'WR-01', name: 'Mumbai Central – Vadodara', zone: 'WR', color: '#f97316',
    daily_trains: 200, length_km: 392,
    coords: [[18.970, 72.819], [20.000, 73.000], [21.200, 72.900], [22.310, 73.190]] as [number, number][],
    stations: ['Mumbai Central', 'Surat', 'Vadodara'],
  },
  {
    id: 'WR-02', name: 'Vadodara – Ahmedabad', zone: 'WR', color: '#fb923c',
    daily_trains: 180, length_km: 110,
    coords: [[22.310, 73.190], [22.600, 72.900], [23.022, 72.580]] as [number, number][],
    stations: ['Vadodara', 'Anand', 'Ahmedabad'],
  },
  {
    id: 'NR-01', name: 'New Delhi – Mathura', zone: 'NR', color: '#ef4444',
    daily_trains: 220, length_km: 141,
    coords: [[28.642, 77.220], [28.100, 77.400], [27.492, 77.673]] as [number, number][],
    stations: ['New Delhi', 'Palwal', 'Mathura Jn'],
  },
  {
    id: 'NR-02', name: 'Mathura – Agra', zone: 'NR', color: '#f87171',
    daily_trains: 160, length_km: 58,
    coords: [[27.492, 77.673], [27.300, 77.850], [27.177, 78.008]] as [number, number][],
    stations: ['Mathura Jn', 'Agra Cantt', 'Agra Fort'],
  },
];

// ─── Mock maintenance blocks per corridor ────────────────────────────────────
const MOCK_BLOCKS: Record<string, { window: string; dept: string; tasks: number; status: 'Active' | 'Upcoming' | 'Completed' }[]> = {
  'CR-01': [
    { window: '01:00 – 04:00', dept: 'Engineering', tasks: 8, status: 'Upcoming' },
    { window: '11:00 – 13:00', dept: 'S&T', tasks: 3, status: 'Completed' },
  ],
  'SCR-01': [
    { window: '00:30 – 04:30', dept: 'TRD', tasks: 5, status: 'Active' },
  ],
  'WR-01': [
    { window: '02:00 – 05:00', dept: 'Engineering + TRD', tasks: 12, status: 'Upcoming' },
  ],
  'NR-01': [
    { window: '00:00 – 05:00', dept: 'Engineering', tasks: 15, status: 'Active' },
  ],
};

// ─── Zone colors ─────────────────────────────────────────────────────────────
const ZONE_COLORS: Record<string, string> = {
  CR: '#6366f1', SCR: '#10b981', WR: '#f97316', NR: '#ef4444',
};

// ─── Create custom colored train marker ──────────────────────────────────────
function createTrainIcon(color: string) {
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24">
      <rect x="2" y="2" width="28" height="16" rx="3" fill="${color}" opacity="0.9"/>
      <rect x="4" y="5" width="6" height="5" rx="1" fill="rgba(255,255,255,0.8)"/>
      <rect x="12" y="5" width="6" height="5" rx="1" fill="rgba(255,255,255,0.8)"/>
      <rect x="20" y="5" width="6" height="5" rx="1" fill="rgba(255,255,255,0.8)"/>
      <circle cx="8" cy="20" r="3" fill="${color}" stroke="white" stroke-width="1"/>
      <circle cx="22" cy="20" r="3" fill="${color}" stroke="white" stroke-width="1"/>
      <circle cx="28" cy="20" r="2" fill="#fde68a" opacity="0.9"/>
    </svg>`;
  return L.divIcon({
    html: `<div style="filter: drop-shadow(0 0 6px ${color});">${svgContent}</div>`,
    className: 'custom-train-icon',
    iconSize: [36, 24],
    iconAnchor: [18, 12],
  });
}

// ─── Animated train that moves along route ───────────────────────────────────
function MovingTrain({ corridor }: { corridor: typeof CORRIDORS[0] }) {
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
        return prev + 0.015;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [forward, posIndex, corridor.coords.length]);

  const a = corridor.coords[posIndex];
  const b = corridor.coords[Math.min(posIndex + 1, corridor.coords.length - 1)];
  const lat = a[0] + (b[0] - a[0]) * progress;
  const lng = a[1] + (b[1] - a[1]) * progress;

  const icon = createTrainIcon(corridor.color);
  const trainNum = `${corridor.zone}${(corridor.id.split('-')[1]).padStart(3, '0')}${Math.floor(Math.random() * 100 + 1).toString().padStart(2, '0')}`;

  return (
    <Marker position={[lat, lng]} icon={icon}>
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', minWidth: 160 }}>
          <div style={{ fontWeight: 700, color: corridor.color, marginBottom: 2 }}>🚆 Train #{trainNum}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{corridor.name}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {corridor.stations[Math.min(posIndex, corridor.stations.length - 1)]} →{' '}
            {corridor.stations[Math.min(posIndex + 1, corridor.stations.length - 1)]}
          </div>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
              ● Running
            </span>
          </div>
        </div>
      </Tooltip>
    </Marker>
  );
}

// ─── Component to set map bounds on mount ────────────────────────────────────
function MapBoundsController() {
  const map = useMap();
  useEffect(() => {
    map.setView([22, 78], 5);
  }, [map]);
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LiveTrainMap() {
  const [selectedCorridor, setSelectedCorridor] = useState<typeof CORRIDORS[0] | null>(null);
  const [filterZone, setFilterZone] = useState('');
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-between items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Train className="w-6 h-6 text-indigo-400" />
            Live Train Network Map
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time corridor view with active maintenance block overlays
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live clock */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="font-mono text-sm text-white">
              {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Zone filter */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterZone}
              onChange={e => setFilterZone(e.target.value)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none"
            >
              <option value="">All Zones</option>
              <option value="CR">Central Railway (CR)</option>
              <option value="SCR">South Central (SCR)</option>
              <option value="WR">Western Railway (WR)</option>
              <option value="NR">Northern Railway (NR)</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: 'Trains Running', value: filteredCorridors.reduce((s, c) => s + Math.floor(c.daily_trains / 24), 0), color: 'text-green-400', icon: '🚆' },
          { label: 'Active Blocks', value: activeBlocks, color: 'text-red-400', icon: '🔴' },
          { label: 'Upcoming Blocks', value: upcomingBlocks, color: 'text-orange-400', icon: '🟡' },
          { label: 'Corridors Monitored', value: filteredCorridors.length, color: 'text-indigo-400', icon: '📍' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-3"
          >
            <span className="text-xl">{stat.icon}</span>
            <div>
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Map + Side panel */}
      <div className="flex gap-4" style={{ height: '520px' }}>
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 rounded-xl overflow-hidden border border-slate-700"
          style={{ boxShadow: '0 0 0 1px rgba(99,102,241,0.2), 0 8px 32px rgba(0,0,0,0.4)' }}
        >
          <MapContainer
            center={[22, 78]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <MapBoundsController />

            {/* Dark CartoDB tile layer */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              subdomains="abcd"
            />

            {filteredCorridors.map(corridor => (
              <div key={corridor.id}>
                {/* Route polyline */}
                <Polyline
                  positions={corridor.coords}
                  pathOptions={{
                    color: corridor.color,
                    weight: 3,
                    opacity: 0.85,
                    dashArray: undefined,
                  }}
                  eventHandlers={{
                    click: () => setSelectedCorridor(corridor),
                  }}
                >
                  <Tooltip sticky direction="top" opacity={1}>
                    <div style={{ background: '#1e293b', padding: '4px 8px', borderRadius: 4, color: corridor.color, fontWeight: 700 }}>
                      {corridor.id}: {corridor.name}
                    </div>
                  </Tooltip>
                </Polyline>

                {/* Animated train marker */}
                <MovingTrain corridor={corridor} />

                {/* Active block warning overlay on route midpoint */}
                {MOCK_BLOCKS[corridor.id]?.some(b => b.status === 'Active') && (
                  <Marker
                    position={corridor.coords[Math.floor(corridor.coords.length / 2)]}
                    icon={L.divIcon({
                      html: `<div style="
                        background: rgba(239,68,68,0.9);
                        border: 2px solid #fca5a5;
                        border-radius: 50%;
                        width: 18px; height: 18px;
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 0 12px rgba(239,68,68,0.7);
                        animation: signal-pulse 1.5s ease-in-out infinite;
                        font-size: 9px; color: white; font-weight: bold;
                      ">⚠</div>`,
                      className: '',
                      iconSize: [18, 18],
                      iconAnchor: [9, 9],
                    })}
                    eventHandlers={{ click: () => setSelectedCorridor(corridor) }}
                  >
                    <Tooltip direction="top" opacity={1}>
                      <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: 6, padding: '4px 8px', color: '#fca5a5', fontSize: 11 }}>
                        ⚠️ Active maintenance block on {corridor.id}
                      </div>
                    </Tooltip>
                  </Marker>
                )}
              </div>
            ))}
          </MapContainer>
        </motion.div>

        {/* Info panel (shown when corridor clicked) */}
        <AnimatePresence>
          {selectedCorridor && (
            <motion.div
              initial={{ opacity: 0, x: 40, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 280 }}
              exit={{ opacity: 0, x: 40, width: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden flex flex-col"
              style={{ minWidth: 280 }}
            >
              {/* Panel header */}
              <div
                className="p-4 border-b border-slate-700 flex justify-between items-start"
                style={{ borderLeft: `4px solid ${selectedCorridor.color}` }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: ZONE_COLORS[selectedCorridor.zone] + '30', color: ZONE_COLORS[selectedCorridor.zone] }}
                    >
                      {selectedCorridor.zone}
                    </span>
                    <span className="text-xs text-slate-400">{selectedCorridor.id}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-tight">{selectedCorridor.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedCorridor(null)}
                  className="text-slate-500 hover:text-white transition-colors mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Daily Trains', value: selectedCorridor.daily_trains, unit: '' },
                    { label: 'Length', value: selectedCorridor.length_km, unit: ' km' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/60">
                      <div className="text-xs text-slate-400 mb-1">{s.label}</div>
                      <div className="text-lg font-bold text-white">{s.value}{s.unit}</div>
                    </div>
                  ))}
                </div>

                {/* Stations */}
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-2 tracking-wide">Stations</div>
                  <div className="space-y-1">
                    {selectedCorridor.stations.map((st, i) => (
                      <div key={st} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: i === 0 ? '#10b981' : i === selectedCorridor.stations.length - 1 ? '#ef4444' : selectedCorridor.color }}
                        />
                        <span className="text-sm text-slate-300">{st}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Maintenance windows */}
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold mb-2 tracking-wide">
                    Maintenance Windows
                  </div>
                  {(MOCK_BLOCKS[selectedCorridor.id] || []).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No blocks scheduled this week.</p>
                  ) : (
                    <div className="space-y-2">
                      {(MOCK_BLOCKS[selectedCorridor.id] || []).map((block, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="bg-slate-900/80 rounded-lg p-3 border border-slate-700/60"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono text-slate-300">{block.window}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              block.status === 'Active'
                                ? 'bg-red-500/20 text-red-400'
                                : block.status === 'Upcoming'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-slate-700 text-slate-400'
                            }`}>
                              {block.status}
                            </span>
                          </div>
                          <div className="text-xs text-indigo-300 mb-1">{block.dept}</div>
                          <div className="text-xs text-slate-500">{block.tasks} tasks assigned</div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zone legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-4 items-center p-3 bg-slate-800/40 border border-slate-700/60 rounded-lg"
      >
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Legend:</span>
        {Object.entries(ZONE_COLORS).map(([zone, color]) => (
          <button
            key={zone}
            onClick={() => setFilterZone(filterZone === zone ? '' : zone)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
              filterZone === zone ? 'border-current' : 'border-transparent'
            }`}
            style={{ color, background: color + '15' }}
          >
            <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: color }} />
            {zone === 'CR' ? 'Central Railway' : zone === 'SCR' ? 'South Central' : zone === 'WR' ? 'Western Railway' : 'Northern Railway'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400" style={{ boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />
            Active Block
          </span>
          <span className="flex items-center gap-1.5">
            🚆 Moving Train
          </span>
        </div>
      </motion.div>
    </div>
  );
}
