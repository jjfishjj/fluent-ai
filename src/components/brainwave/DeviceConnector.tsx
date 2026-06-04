import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bluetooth, Play, Square, Wifi, WifiOff, Battery } from 'lucide-react';
import { useBrainwave } from '@/contexts/BrainwaveContext';
import { useToast } from '@/hooks/use-toast';

export function DeviceConnector() {
  const { mode, deviceStatus, connectMuse, startSimulation, disconnect } = useBrainwave();
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnectMuse = async () => {
    if (!('bluetooth' in navigator)) {
      toast({
        title: 'Web Bluetooth not supported',
        description: 'Please use Chrome or Edge browser on desktop.',
        variant: 'destructive',
      });
      return;
    }
    setConnecting(true);
    try {
      await connectMuse();
      toast({ title: 'Connected!', description: `${deviceStatus.deviceName ?? 'Muse'} is streaming EEG data.` });
    } catch (e: any) {
      toast({ title: 'Connection failed', description: e?.message ?? 'Could not connect to device.', variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  if (mode !== 'disconnected') {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="gap-1.5 py-1 px-3 text-emerald-600 border-emerald-300 bg-emerald-50">
          <Wifi className="w-3 h-3" />
          {deviceStatus.deviceName ?? 'Connected'}
        </Badge>
        {deviceStatus.batteryLevel !== null && (
          <Badge variant="outline" className="gap-1 py-1 px-2 text-xs">
            <Battery className="w-3 h-3" /> {deviceStatus.batteryLevel}%
          </Badge>
        )}
        {mode === 'simulation' && (
          <Badge variant="secondary" className="text-xs">Demo Mode</Badge>
        )}
        <Button variant="outline" size="sm" onClick={disconnect} className="gap-1.5">
          <Square className="w-3 h-3" /> Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors cursor-pointer" onClick={handleConnectMuse}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Bluetooth className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-base">Connect Muse Headband</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Muse 2 / Muse S / Muse 3 via Web Bluetooth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="default"
            size="sm"
            className="w-full"
            disabled={connecting}
            onClick={e => { e.stopPropagation(); handleConnectMuse(); }}
          >
            {connecting ? 'Searching…' : 'Connect Device'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Requires Chrome / Edge browser</p>
        </CardContent>
      </Card>

      <Card className="border-2 border-dashed border-violet-200 hover:border-violet-400 transition-colors cursor-pointer" onClick={startSimulation}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-violet-500" />
            <CardTitle className="text-base">Demo Mode</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Simulated brainwave data — no hardware needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-violet-300 text-violet-700 hover:bg-violet-50"
            onClick={e => { e.stopPropagation(); startSimulation(); }}
          >
            Start Demo
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Cycles through realistic brain states</p>
        </CardContent>
      </Card>
    </div>
  );
}
