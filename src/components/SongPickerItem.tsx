import { cn } from '@/lib/utils';
import type { Song } from '@/lib/types';
import { formatDuration } from '@/lib/types';
import { Plus, Check, AlertTriangle } from 'lucide-react';

interface SongPickerItemProps {
  song: Song;
  isInSetlist: boolean;
  hasFlowWarning?: boolean;
  flowWarningMessage?: string;
  onToggle: () => void;
}

export function SongPickerItem({
  song,
  isInSetlist,
  hasFlowWarning,
  flowWarningMessage,
  onToggle,
}: SongPickerItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all touch-target text-left",
        "active:scale-[0.98]",
        isInSetlist
          ? "bg-primary/10 border border-primary/30"
          : "bg-card/50 border border-transparent hover:bg-card hover:border-border"
      )}
    >
      {/* Add/Remove indicator */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
          isInSetlist
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground"
        )}
      >
        {isInSetlist ? (
          <Check className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </div>

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium truncate text-sm",
            isInSetlist ? "text-primary" : "text-foreground"
          )}>
            {song.title}
          </span>
          {hasFlowWarning && !isInSetlist && (
            <span title={flowWarningMessage} className="shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span className="font-mono">{formatDuration(song.durationSeconds)}</span>
          <span className="text-border">•</span>
          <span>{song.bpm} BPM</span>
          <span className="text-border">•</span>
          <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-medium">
            {song.musicalKey}{song.keyMode === 'Minor' ? 'm' : ''}
          </span>
        </div>
      </div>

      {/* Energy indicator (compact) */}
      <div className="hidden xs:flex items-center gap-0.5 shrink-0">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "w-1 rounded-full transition-all",
              level <= song.energyLevel
                ? "bg-primary h-3"
                : "bg-border h-2"
            )}
          />
        ))}
      </div>
    </button>
  );
}
