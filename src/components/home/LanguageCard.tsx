import { LanguageConfig } from '@/lib/types';
import { ChevronRight } from 'lucide-react';

interface LanguageCardProps {
  language: LanguageConfig;
  onClick: (language: LanguageConfig) => void;
}

export function LanguageCard({ language, onClick }: LanguageCardProps) {
  return (
    <button
      onClick={() => onClick(language)}
      className={`language-card lang-${language.id} w-full text-left group`}
    >
      <div className="relative z-10">
        <div className="text-4xl mb-3 flag-emoji">{language.flag}</div>
        <h3 className="text-xl font-bold mb-1 lang-name">{language.name}</h3>
        <p className="text-sm text-muted-foreground">{language.nativeName}</p>
        {language.variants && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {language.variants.map((variant) => (
              <span 
                key={variant.id}
                className="variant-tag text-xs px-2.5 py-1 rounded-full text-muted-foreground"
              >
                {variant.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
        <ChevronRight className="w-5 h-5" style={{ color: 'hsl(var(--lang-color))' }} />
      </div>
    </button>
  );
}
