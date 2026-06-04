import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { BandPowers, BrainState, DeviceStatus, BrainwaveSnapshot } from '@/lib/brainwave/types';
import { detectBrainState } from '@/lib/brainwave/brain-state-detector';
import { MuseService } from '@/lib/brainwave/muse-service';
import { BrainwaveSimulator } from '@/lib/brainwave/simulator';
import { EMPTY_BANDS } from '@/lib/brainwave/signal-processor';

type ConnectionMode = 'disconnected' | 'hardware' | 'simulation';

interface BrainwaveContextType {
  mode: ConnectionMode;
  bands: BandPowers;
  brainState: BrainState;
  deviceStatus: DeviceStatus;
  history: BrainwaveSnapshot[];
  connectMuse: () => Promise<void>;
  startSimulation: () => void;
  disconnect: () => void;
}

const defaultStatus: DeviceStatus = {
  connected: false,
  deviceName: null,
  batteryLevel: null,
  electrodeQuality: [],
  isStreaming: false,
};

const BrainwaveContext = createContext<BrainwaveContextType | undefined>(undefined);

const MAX_HISTORY = 300; // 60 seconds at 5 samples/sec

export function BrainwaveProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ConnectionMode>('disconnected');
  const [bands, setBands] = useState<BandPowers>(EMPTY_BANDS);
  const [brainState, setBrainState] = useState<BrainState>('neutral');
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>(defaultStatus);
  const [history, setHistory] = useState<BrainwaveSnapshot[]>([]);

  const museRef = useRef<MuseService | null>(null);
  const simRef = useRef<BrainwaveSimulator | null>(null);

  const handleBands = useCallback((newBands: BandPowers) => {
    setBands(newBands);
    const state = detectBrainState(newBands);
    setBrainState(state);
    setHistory(prev => {
      const snap: BrainwaveSnapshot = { timestamp: Date.now(), bands: newBands, state };
      const next = [...prev, snap];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  }, []);

  const connectMuse = useCallback(async () => {
    const svc = new MuseService();
    svc.onBandPowers = handleBands;
    svc.onDeviceStatus = (s) => setDeviceStatus(prev => ({ ...prev, ...s }));
    await svc.connect();
    museRef.current = svc;
    setMode('hardware');
  }, [handleBands]);

  const startSimulation = useCallback(() => {
    const sim = new BrainwaveSimulator();
    sim.onBandPowers = handleBands;
    sim.start();
    simRef.current = sim;
    setMode('simulation');
    setDeviceStatus({ connected: true, deviceName: 'Demo Mode', batteryLevel: 100, electrodeQuality: [1, 1, 1, 1], isStreaming: true });
  }, [handleBands]);

  const disconnect = useCallback(() => {
    museRef.current?.disconnect();
    simRef.current?.stop();
    museRef.current = null;
    simRef.current = null;
    setMode('disconnected');
    setBands(EMPTY_BANDS);
    setBrainState('neutral');
    setDeviceStatus(defaultStatus);
  }, []);

  return (
    <BrainwaveContext.Provider value={{ mode, bands, brainState, deviceStatus, history, connectMuse, startSimulation, disconnect }}>
      {children}
    </BrainwaveContext.Provider>
  );
}

export function useBrainwave() {
  const ctx = useContext(BrainwaveContext);
  if (!ctx) throw new Error('useBrainwave must be used within BrainwaveProvider');
  return ctx;
}
