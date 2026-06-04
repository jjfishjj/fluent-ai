import { MuseClient } from 'muse-js';
import { BandPowers, DeviceStatus } from './types';
import { computeBandPowers, smoothBands, EMPTY_BANDS } from './signal-processor';

const SAMPLE_RATE = 256;
const BUFFER_SIZE = 256; // 1 second of samples

export class MuseService {
  private client: MuseClient;
  private channelBuffers: number[][] = [[], [], [], []];
  private smoothedBands: BandPowers = { ...EMPTY_BANDS };
  private subscriptions: Array<{ unsubscribe: () => void }> = [];

  onBandPowers?: (bands: BandPowers) => void;
  onDeviceStatus?: (status: Partial<DeviceStatus>) => void;

  constructor() {
    this.client = new MuseClient();
  }

  async connect(): Promise<void> {
    await this.client.connect();
    await this.client.start();

    // EEG readings: electrode 0–3 (TP9, AF7, AF8, TP10)
    const eegSub = this.client.eegReadings.subscribe((reading) => {
      const ch = reading.electrode;
      if (ch >= 0 && ch < 4) {
        this.channelBuffers[ch].push(...Array.from(reading.samples));
        if (this.channelBuffers[ch].length > BUFFER_SIZE * 2) {
          this.channelBuffers[ch] = this.channelBuffers[ch].slice(-BUFFER_SIZE * 2);
        }
        // Process when we have enough samples on channel 0
        if (ch === 0 && this.channelBuffers[0].length >= BUFFER_SIZE) {
          this.processSamples();
        }
      }
    });
    this.subscriptions.push(eegSub);

    // Telemetry (battery)
    const teleSub = this.client.telemetryData.subscribe((t) => {
      this.onDeviceStatus?.({ batteryLevel: t.batteryLevel });
    });
    this.subscriptions.push(teleSub);

    this.onDeviceStatus?.({
      connected: true,
      deviceName: this.client.deviceName,
      isStreaming: true,
      electrodeQuality: [0, 0, 0, 0],
    });
  }

  private processSamples() {
    // Average across all 4 channels for more robust signal
    const len = Math.min(BUFFER_SIZE, ...this.channelBuffers.map(b => b.length));
    const averaged = Array.from({ length: len }, (_, i) =>
      this.channelBuffers.reduce((sum, buf) => sum + (buf[buf.length - len + i] ?? 0), 0) / 4
    );

    const raw = computeBandPowers(averaged, SAMPLE_RATE);
    this.smoothedBands = smoothBands(this.smoothedBands, raw, 0.3);
    this.onBandPowers?.(this.smoothedBands);
  }

  async disconnect(): Promise<void> {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
    this.channelBuffers = [[], [], [], []];
    try { await this.client.disconnect(); } catch { /* ignore */ }
    this.onDeviceStatus?.({ connected: false, isStreaming: false });
  }

  get isConnected(): boolean {
    return this.client.connectionStatus.getValue();
  }
}
