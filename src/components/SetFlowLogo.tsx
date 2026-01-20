import { cn } from '@/lib/utils';

interface SetFlowLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function SetFlowLogo({ className, size = 'md', showText = true }: SetFlowLogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-base', iconSize: 16 },
    md: { icon: 'w-10 h-10', text: 'text-lg', iconSize: 20 },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', iconSize: 28 },
  };

  const s = sizes[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Logo Icon - Document outline on themed background */}
      <div className={cn(
        'relative flex items-center justify-center rounded-xl bg-primary/10 p-2 shadow-sm border border-primary/20',
        s.icon
      )}>
        {/* Document icon - black outline */}
        <svg
          width={s.iconSize}
          height={s.iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground"
        >
          {/* Document shape */}
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          {/* Folded corner */}
          <polyline points="14 2 14 8 20 8" />
          {/* Lines representing setlist */}
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="14" y2="17" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-semibold tracking-tight leading-none', s.text)}>
            Set<span className="text-primary">Flow</span>
          </span>
          <span className="text-[10px] text-muted-foreground tracking-wide uppercase">
            Setlist Planner
          </span>
        </div>
      )}
    </div>
  );
}
