import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Train, Volume2, VolumeX, ArrowRight, Play, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const CINEMATIC_VIDEOS = [
  {
    title: 'Western Ghats & Konkan Mountain Viaduct Crossing',
    url: 'https://videos.pexels.com/video-files/2814470/2814470-hd_1920_1080_24fps.mp4',
    poster: 'https://images.pexels.com/photos/2814470/pexels-photo-2814470.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    title: 'Vande Bharat Mountain Pass Corridor',
    url: 'https://videos.pexels.com/video-files/4434242/4434242-hd_1920_1080_25fps.mp4',
    poster: 'https://images.pexels.com/photos/4434242/pexels-photo-4434242.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [videoIndex, setVideoIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [countdown, setCountdown] = useState(6);
  const [isExiting, setIsExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentVideo = CINEMATIC_VIDEOS[videoIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEnter();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="cinematic-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-slate-950 text-white select-none"
        >
          {/* Fullscreen Video Background */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {/* Fallback Poster */}
            <img
              src={currentVideo.poster}
              alt="Indian Railways Mountain Crossing"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                isVideoLoaded ? 'opacity-0' : 'opacity-100'
              }`}
            />

            <video
              ref={videoRef}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              preload="auto"
              poster={currentVideo.poster}
              onLoadedData={() => setIsVideoLoaded(true)}
              className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75] contrast-[1.1] scale-105"
            >
              <source src={currentVideo.url} type="video/mp4" />
            </video>

            {/* Dark Vignette & Gradient Overlays for High Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.75)_100%)]" />
          </div>

          {/* Top Bar: Indian Railways Insignia & Controls */}
          <div className="relative z-20 flex items-center justify-between p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border-2 border-amber-400/80 flex items-center justify-center bg-slate-950/80 backdrop-blur-md shadow-lg">
                <Train className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
                    भारतीय रेल · INDIAN RAILWAYS
                  </span>
                  <span className="text-[10px] bg-red-600/80 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">Ministry of Railways · Govt. of India</p>
              </div>
            </div>

            {/* Skip & Video Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setVideoIndex((videoIndex + 1) % CINEMATIC_VIDEOS.length)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 backdrop-blur-md transition-all"
                title="Switch Cinematic Angle"
              >
                <Play className="w-3 h-3 text-amber-400" /> Switch Scene ({videoIndex + 1}/2)
              </button>

              <button
                onClick={handleEnter}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-bold shadow-xl border border-blue-400/30 transition-all hover:scale-105"
              >
                <span>Enter Operations Dashboard</span>
                <ArrowRight className="w-4 h-4" />
                <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-700/80 font-mono text-xs">
                  {countdown}s
                </span>
              </button>
            </div>
          </div>

          {/* Central Hero: Title & Indian Railways Identity */}
          <div className="relative z-20 max-w-4xl mx-auto px-6 text-center space-y-4">
            {/* Tricolor Ribbon Bar */}
            <div className="w-32 h-1.5 mx-auto rounded-full ir-tricolor-bar shadow-md mb-2" />

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-2xl">
                SAMANVAY <span className="text-amber-400 font-light">(समन्वय)</span>
              </h1>
              <p className="text-lg md:text-xl font-semibold text-blue-200 mt-2 tracking-wide drop-shadow">
                AI-Powered Automatic Block Planning for Indian Railways
              </p>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl mx-auto mt-2 leading-relaxed drop-shadow">
                Unifying maintenance possessions across <strong>Track Engineering (TMS)</strong>,{' '}
                <strong>Signaling & Telecom (SMMS)</strong>, and <strong>Traction Distribution (TDMS)</strong> into coordinated multi-department block windows.
              </p>
            </motion.div>

            {/* Key Pillars Badges */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-2.5 pt-2"
            >
              <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 backdrop-blur-md text-xs font-semibold text-amber-300">
                🏔️ {currentVideo.title}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 backdrop-blur-md text-xs font-semibold text-blue-300">
                ⚡ Google OR-Tools CP-SAT Block Merging
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 backdrop-blur-md text-xs font-semibold text-emerald-300">
                🛡️ Zero-Drop Safety Hard Constraints
              </span>
            </motion.div>
          </div>

          {/* Bottom Bar: Indian Railways Network Metrics */}
          <div className="relative z-20 p-6 md:p-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
            <div className="flex items-center gap-6 text-xs text-slate-300">
              <div>
                <span className="text-amber-400 font-bold">10 High-Density Corridors</span>
                <p className="text-[10px] text-slate-400">CR, SCR, WR, NR Zones</p>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-emerald-400 font-bold">450 Synthetic Infrastructure Defects</span>
                <p className="text-[10px] text-slate-400">TMS + SMMS + TDMS Feeds</p>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-blue-400 font-bold">68.9% Possession Reduction</span>
                <p className="text-[10px] text-slate-400">Optimized Corridor Sharing</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 italic">Problem Statement #26027</span>
              <button
                onClick={handleEnter}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-lg"
              >
                Launch Dashboard →
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
