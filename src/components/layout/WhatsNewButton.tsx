import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WHATS_NEW } from '@/lib/whats-new';

const SEEN_KEY = 'fluent_whatsnew_last_seen';

export function WhatsNewButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const lastSeen = localStorage.getItem(SEEN_KEY);
    const count = lastSeen ? WHATS_NEW.filter((e) => e.id > lastSeen).length : WHATS_NEW.length;
    setUnreadCount(count);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && WHATS_NEW.length > 0) {
      localStorage.setItem(SEEN_KEY, WHATS_NEW[0].id);
      setUnreadCount(0);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className || ''}`} aria-label="更新公告">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border">
          <p className="font-semibold text-sm">更新公告</p>
        </div>
        <ScrollArea className="max-h-80">
          <div className="p-3 space-y-4">
            {WHATS_NEW.map((entry) => (
              <div key={entry.id}>
                <p className="text-xs text-muted-foreground mb-0.5">{entry.date}</p>
                <p className="text-sm font-medium">{entry.title}</p>
                <p className="text-sm text-muted-foreground">{entry.description}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
