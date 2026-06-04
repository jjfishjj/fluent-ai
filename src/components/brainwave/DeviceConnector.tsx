import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bluetooth, Play, Square, Activity, Wifi, Battery, Brain } from 'lucide-react';
import { useBrainwave } from '@/contexts/BrainwaveContext';
import { useToast } from '@/hooks/use-toast';

export function DeviceConnector() {
  const { mode, deviceStatus, startBehavioral, connectMuse, startSimulation, disconnect } = useBrainwave();
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
      toast({ title: 'Connected!', description: 'Muse is streaming live EEG data.' });
    } catch (e: any) {
      toast({ title: 'Connection failed', description: e?.message ?? 'Could not connect.', variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  if (mode !== 'disconnected') {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="gap-1.5 py-1 px-3 text-emerald-600 border-emerald-300 bg-emerald-50">
          <Activity className="w-3 h-3 animate-pulse" />
          {deviceStatus.deviceName ?? 'Active'}
        </Badge>
        {deviceStatus.batteryLevel !== null && (
          <Badge variant="outline" className="gap-1 py-1 px-2 text-xs">
            <Battery className="w-3 h-3" /> {deviceStatus.batteryLevel}%
          </Badge>
        )}
        {mode === 'behavioral' && <Badge variant="secondary" className="text-xs">行為推算模式</Badge>}
        {mode === 'simulation' && <Badge variant="secondary" className="text-xs">模擬模式</Badge>}
        {mode === 'hardware' && <Badge className="text-xs bg-blue-500">即時 EEG</Badge>}
        <Button variant="outline" size="sm" onClick={disconnect} className="gap-1.5">
          <Square className="w-3 h-3" /> 停止
        </Button>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {/* Behavioral - PRIMARY */}
      <Card className="border-2 border-emerald-300 bg-emerald-50/50 cursor-pointer hover:shadow-md transition-shadow sm:col-span-1" onClick={startBehavioral}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-base text-emerald-800">行為推算</CardTitle>
          </div>
          <CardDescription className="text-xs">根據時段 × 學習行為推算腦態（推薦）</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="default" size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={e => { e.stopPropagation(); startBehavioral(); }}>
            立即開始分析
          </Button>
          <p className="text-xs text-emerald-700 mt-2">不需任何硬體，基於生理節律科學</p>
        </CardContent>
      </Card>

      {/* Muse Hardware */}
      <Card className="border-dashed cursor-pointer hover:border-blue-300 hover:shadow-md transition-all" onClick={handleConnectMuse}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Bluetooth className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-base">Muse 頭帶</CardTitle>
          </div>
          <CardDescription className="text-xs">即時 EEG 腦波（Muse 2 / S / 3）</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" className="w-full" disabled={connecting} onClick={e => { e.stopPropagation(); handleConnectMuse(); }}>
            {connecting ? '搜尋中…' : '連接裝置'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">需要 Chrome / Edge 瀏覽器</p>
        </CardContent>
      </Card>

      {/* Simulation */}
      <Card className="border-dashed cursor-pointer hover:border-violet-300 hover:shadow-md transition-all" onClick={startSimulation}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-violet-500" />
            <CardTitle className="text-base">Demo 模式</CardTitle>
          </div>
          <CardDescription className="text-xs">模擬腦波資料，無需任何裝置</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" className="w-full border-violet-300 text-violet-700" onClick={e => { e.stopPropagation(); startSimulation(); }}>
            開始 Demo
          </Button>
          <p className="text-xs text-muted-foreground mt-2">自動循環展示各種腦態</p>
        </CardContent>
      </Card>
    </div>
  );
}
