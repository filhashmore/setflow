import { cn } from '@/lib/utils';

interface SetFlowLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function SetFlowLogo({ className, size = 'md', showText = true }: SetFlowLogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-base', bars: 'gap-0.5' },
    md: { icon: 'w-10 h-10', text: 'text-lg', bars: 'gap-0.5' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', bars: 'gap-1' },
  };

  const s = sizes[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Logo Icon - Stylized waveform/equalizer bars forming an "S" flow */}
      <div className={cn(
        'relative flex items-end justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-accent p-2 shadow-lg',
        s.icon
      )}>
        {/* Flowing bars representing music/setlist flow */}
        <div className={cn('flex items-end', s.bars)}>
          <div className="w-1 bg-white/90 rounded-full animate-pulse" style={{ height: '35%', animationDelay: '0ms' }} />
          <div className="w-1 bg-white/90 rounded-full animate-pulse" style={{ height: '70%', animationDelay: '100ms' }} />
          <div className="w-1 bg-white/90 rounded-full animate-pulse" style={{ height: '50%', animationDelay: '200ms' }} />
          <div className="w-1 bg-white/90 rounded-full animate-pulse" style={{ height: '85%', animationDelay: '300ms' }} />
          <div className="w-1 bg-white/90 rounded-full animate-pulse" style={{ height: '40%', animationDelay: '400ms' }} />
        </div>
        {/* Subtle flow arrow overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 40 40"
          fill="none"
        >
          <path
            d="M10 30 Q20 20 30 25 Q35 27 35 20 Q35 13 25 15 Q15 17 20 10"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
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
