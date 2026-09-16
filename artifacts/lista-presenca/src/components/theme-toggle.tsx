import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group inline-flex items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-secondary ${
        compact ? 'size-11' : 'min-h-11 gap-2.5 px-4'
      }`}
      aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      data-testid="button-theme-toggle"
    >
      <span className="relative grid size-5 place-items-center">
        <Sun className={`absolute size-[18px] transition-all duration-300 ${dark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
        <Moon className={`absolute size-[18px] transition-all duration-300 ${dark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
      </span>
      {!compact && (
        <span className="text-sm font-medium">{dark ? 'Modo claro' : 'Modo escuro'}</span>
      )}
    </button>
  );
}