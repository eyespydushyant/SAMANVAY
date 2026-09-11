import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import WeeklyPlan from './pages/WeeklyPlan';
import MonthlyPlan from './pages/MonthlyPlan';
import AuditLog from './pages/AuditLog';
import LiveTrainMap from './pages/LiveTrainMap';
import CorridorHealth from './pages/CorridorHealth';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ThemeProvider onReplayIntro={() => setSplashDone(false)}>
      <AnimatePresence>
        {!splashDone && (
          <SplashScreen onComplete={() => setSplashDone(true)} />
        )}
      </AnimatePresence>

      {splashDone && (
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/weekly-plan" element={<WeeklyPlan />} />
              <Route path="/monthly-plan" element={<MonthlyPlan />} />
              <Route path="/live-map" element={<LiveTrainMap />} />
              <Route path="/corridors" element={<CorridorHealth />} />
              <Route path="/audit" element={<AuditLog />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      )}
    </ThemeProvider>
  );
}
