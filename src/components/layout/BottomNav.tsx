import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Brain, Calendar, User } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/',          label: 'Home',    icon: Home },
  { to: '/practice',  label: '練習',    icon: MessageSquare },
  { to: '/brain-lab', label: 'Brain',   icon: Brain },
  { to: '/memory',    label: '記憶',    icon: Calendar },
  { to: '/profile',   label: 'Profile', icon: User },
];

export function BottomNav() {
  const location = useLocation();

  const handleTap = () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-border/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {TABS.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={handleTap}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            >
              <Icon className={cn('w-5 h-5 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-[11px] font-medium transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
