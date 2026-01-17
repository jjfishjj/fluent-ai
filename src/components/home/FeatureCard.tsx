import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: boolean;
}

export function FeatureCard({ icon: Icon, title, description, gradient = false }: FeatureCardProps) {
  return (
    <div className="scenario-card group">
      <div 
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${
          gradient 
            ? 'gradient-primary shadow-glow' 
            : 'bg-secondary'
        }`}
      >
        <Icon className={`w-6 h-6 ${gradient ? 'text-primary-foreground' : 'text-primary'}`} />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
