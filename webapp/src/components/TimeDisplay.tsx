import { useMemo } from 'react';
import { Clock, Target, TrendingUp, TrendingDown, Check, AlertTriangle } from 'lucide-react';
import { formatDuration, type TimeStatus } from '@/lib/types';
import { calculateTimeStatus } from '@/lib/store';
import { cn } from '@/lib/utils';

interface TimeDisplayProps {
  totalSeconds: number;
  targetMinutes: number;
  changeoverMinutes: number;
}

function getStatusConfig(status: TimeStatus) {
  switch (status) {
    case 'good':
      return {
        className: 'status-good',
        icon: Check,
        label: 'On Target',
      };
    case 'close':
      return {
        className: 'status-warning',
        icon: AlertTriangle,
        label: 'Close',
      };
    case 'over':
      return {
        className: 'status-danger',
        icon: TrendingUp,
        label: 'Over',
      };
    case 'under':
      return {
        className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        icon: TrendingDown,
        label: 'Under',
      };
  }
}

function formatDifference(seconds: number): string {
  const absSeconds = Math.abs(seconds);
  const formatted = formatDuration(absSeconds);
  if (seconds > 0) {
    return `+${formatted}`;
  } else if (seconds < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

export function TimeDisplay({
  totalSeconds,
  targetMinutes,
  changeoverMinutes,
}: TimeDisplayProps) {
  const { status, difference } = useMemo(
    () => calculateTimeStatus(totalSeconds, targetMinutes, changeoverMinutes),
    [totalSeconds, targetMinutes, changeoverMinutes]
  );

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const targetMusicTime = targetMinutes - changeoverMinutes;

  return (
    <div className="rounded-xl bg-card/60 border border-border/50 p-4 md:p-6">
      {/* Main Time Display */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
          <Clock className="h-4 w-4" />
          <span>Total Duration</span>
        </div>
        <div
          key={totalSeconds}
          className="font-mono text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight gradient-text transition-all duration-150"
        >
          {formatDuration(totalSeconds)}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-4">
        <div
          key={status}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full border font-medium text-sm transition-all duration-200',
            statusConfig.className
          )}
        >
          <StatusIcon className="h-4 w-4" />
          <span>{statusConfig.label}</span>
          {status !== 'good' ? (
            <span className="font-mono tabular-nums">
              {formatDifference(difference)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {/* Target Music Time */}
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mb-1">
            <Target className="h-3.5 w-3.5" />
            <span>Target</span>
          </div>
          <div className="font-mono text-xl md:text-2xl font-semibold text-foreground tabular-nums">
            {targetMusicTime}:00
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            ({targetMinutes}m slot - {changeoverMinutes}m change)
          </div>
        </div>

        {/* Difference */}
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs mb-1">
            {difference >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>Difference</span>
          </div>
          <div
            className={cn(
              'font-mono text-xl md:text-2xl font-semibold tabular-nums',
              status === 'good' && 'text-emerald-400',
              status === 'close' && 'text-amber-400',
              status === 'over' && 'text-red-400',
              status === 'under' && 'text-blue-400'
            )}
          >
            {formatDifference(difference)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {status === 'good' ? 'Right on time' : status === 'under' ? 'Room to add' : 'Adjust setlist'}
          </div>
        </div>
      </div>
    </div>
  );
}
