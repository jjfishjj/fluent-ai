import { useState } from 'react';
import { Scenario, DifficultyLevel, SpeechSpeed, ToneStyle, ConversationMode } from '@/lib/types';
import { SCENARIOS, DIFFICULTY_LABELS, SPEED_LABELS, TONE_LABELS, MODE_INFO } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronRight, Zap, Clock, MessageSquare } from 'lucide-react';

interface ScenarioSelectorProps {
  selectedScenario: Scenario | null;
  onSelectScenario: (scenario: Scenario) => void;
  difficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
  speed: SpeechSpeed;
  onSpeedChange: (speed: SpeechSpeed) => void;
  tone: ToneStyle;
  onToneChange: (tone: ToneStyle) => void;
  mode: ConversationMode;
  onModeChange: (mode: ConversationMode) => void;
  instantCorrection: boolean;
  onInstantCorrectionChange: (enabled: boolean) => void;
  onStartConversation: () => void;
}

export function ScenarioSelector({
  selectedScenario,
  onSelectScenario,
  difficulty,
  onDifficultyChange,
  speed,
  onSpeedChange,
  tone,
  onToneChange,
  mode,
  onModeChange,
  instantCorrection,
  onInstantCorrectionChange,
  onStartConversation,
}: ScenarioSelectorProps) {
  const [selectedSubScenario, setSelectedSubScenario] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Scenario Selection */}
      <section>
        <h2 className="text-xl font-bold mb-4">Choose a Scenario</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => {
                onSelectScenario(scenario);
                setSelectedSubScenario(null);
              }}
              className={`scenario-card ${
                selectedScenario?.id === scenario.id 
                  ? 'border-primary bg-primary/5 shadow-card' 
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl mb-2 block">{scenario.icon}</span>
                  <h3 className="font-semibold mb-1">{scenario.name}</h3>
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                </div>
                {selectedScenario?.id === scenario.id && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Sub-scenarios */}
      {selectedScenario?.subScenarios && (
        <section className="animate-slide-up">
          <h3 className="text-lg font-semibold mb-3">Specific Situation</h3>
          <div className="flex flex-wrap gap-2">
            {selectedScenario.subScenarios.map((sub) => (
              <Badge
                key={sub}
                variant={selectedSubScenario === sub ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => setSelectedSubScenario(sub)}
              >
                {sub}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Mode Selection */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Conversation Mode</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.entries(MODE_INFO) as [ConversationMode, typeof MODE_INFO[ConversationMode]][]).map(([key, info]) => (
            <button
              key={key}
              onClick={() => onModeChange(key)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === key
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <span className="text-2xl mb-2 block">{info.icon}</span>
              <h4 className="font-semibold mb-1">{info.name}</h4>
              <p className="text-xs text-muted-foreground">{info.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Settings Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Difficulty */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Difficulty
          </h3>
          <div className="flex gap-2">
            {(Object.entries(DIFFICULTY_LABELS) as [DifficultyLevel, { label: string; color: string }][]).map(([key, { label, color }]) => (
              <Badge
                key={key}
                variant={difficulty === key ? 'default' : 'outline'}
                className={`cursor-pointer ${difficulty === key ? `bg-${color}` : ''}`}
                onClick={() => onDifficultyChange(key)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Speech Speed
          </h3>
          <div className="flex gap-2">
            {(Object.entries(SPEED_LABELS) as [SpeechSpeed, { label: string; description: string }][]).map(([key, { label }]) => (
              <Badge
                key={key}
                variant={speed === key ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onSpeedChange(key)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Tone Style
          </h3>
          <div className="flex gap-2">
            {(Object.entries(TONE_LABELS) as [ToneStyle, { label: string; description: string }][]).map(([key, { label }]) => (
              <Badge
                key={key}
                variant={tone === key ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onToneChange(key)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Instant Correction Toggle */}
      {mode === 'practice' && (
        <section className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <div>
            <Label htmlFor="instant-correction" className="font-semibold">
              Instant Correction
            </Label>
            <p className="text-sm text-muted-foreground">
              Get real-time grammar and vocabulary feedback
            </p>
          </div>
          <Switch
            id="instant-correction"
            checked={instantCorrection}
            onCheckedChange={onInstantCorrectionChange}
          />
        </section>
      )}

      {/* Start Button */}
      <Button
        variant="gradient"
        size="xl"
        className="w-full"
        disabled={!selectedScenario}
        onClick={onStartConversation}
      >
        Start Conversation
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
