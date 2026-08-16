import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CoreTrainingDemo } from '@/components/practice/CoreTrainingDemo';
import { LearningGymDemoPage } from '@/components/practice/LearningGymDemoPage';
import { NumberEncodingTrainer } from '@/components/practice/NumberEncodingTrainer';
import { useAuth } from '@/contexts/AuthContext';
import { loadGeniusType, loadGeniusVark } from '@/lib/genius-type';
import { LearningStyle } from '@/lib/learning-styles';
import {
  LEARNING_GYM_ABILITY_LABELS,
  LEARNING_GYM_TASKS,
  LearningGymAbility,
  LearningGymProgress,
  LearningGymTask,
  loadLearningGymProgress,
  saveLearningGymProgress,
} from '@/lib/learning-gym';
import NotFound from './NotFound';

type DemoSlug = 'number-encoding-demo' | 'scene-anchor-demo' | 'data-table-demo' | 'emotion-story-demo' | 'concept-web-demo';

const DEMO_TASKS: Record<DemoSlug, LearningGymTask['id']> = {
  'number-encoding-demo': 'number_encoding',
  'scene-anchor-demo': 'scene_anchor',
  'data-table-demo': 'data_to_table',
  'emotion-story-demo': 'story_recall',
  'concept-web-demo': 'concept_web',
};

const isDemoSlug = (value: string | undefined): value is DemoSlug =>
  Boolean(value && value in DEMO_TASKS);

export default function TrainingDemo() {
  const { demoSlug } = useParams<{ demoSlug: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const uid = user?.id || 'guest';
  const [progress, setProgress] = useState<LearningGymProgress>(() => loadLearningGymProgress(uid));
  const geniusType = useMemo(() => loadGeniusType(), []);
  const geniusVark = useMemo(() => loadGeniusVark(), []);

  if (!isDemoSlug(demoSlug)) return <NotFound />;

  const taskId = DEMO_TASKS[demoSlug];
  const task = LEARNING_GYM_TASKS.find((item) => item.id === taskId);
  if (!task) return <NotFound />;

  const rawStyle = profile?.learning_style || geniusVark;
  const learningStyle: LearningStyle | null = (
    rawStyle === 'visual'
    || rawStyle === 'auditory'
    || rawStyle === 'reading'
    || rawStyle === 'kinesthetic'
  ) ? rawStyle : null;

  const handleProgressChange = (
    next: LearningGymProgress,
    gained: Partial<Record<LearningGymAbility, number>>,
  ) => {
    setProgress(next);
    saveLearningGymProgress(next, uid);
    const gainedText = Object.entries(gained)
      .filter(([, value]) => value)
      .map(([ability, value]) => `${LEARNING_GYM_ABILITY_LABELS[ability as LearningGymAbility]} +${value}`)
      .join('、');
    toast.success(gainedText ? `已完成：${gainedText}` : '已完成本次訓練');
  };

  if (task.id === 'number_encoding') {
    return (
      <NumberEncodingTrainer
        task={task}
        progress={progress}
        learningStyle={learningStyle}
        geniusType={geniusType}
        onProgressChange={handleProgressChange}
        onBack={() => navigate('/practice')}
      />
    );
  }

  if (task.id === 'scene_anchor' || task.id === 'data_to_table' || task.id === 'story_recall' || task.id === 'concept_web') {
    return (
      <LearningGymDemoPage
        task={task}
        learningStyle={learningStyle}
        geniusType={geniusType}
        onComplete={(gained) => {
          const next = { ...progress };
          Object.entries(gained).forEach(([ability, value]) => {
            next[ability as LearningGymAbility] += value || 0;
          });
          handleProgressChange(next, gained);
        }}
        onBack={() => navigate('/practice')}
      />
    );
  }

  return (
    <CoreTrainingDemo
      task={task as LearningGymTask & { id: 'scene_anchor' }}
      progress={progress}
      learningStyle={learningStyle}
      geniusType={geniusType}
      onProgressChange={handleProgressChange}
      onBack={() => navigate('/practice')}
    />
  );
}
