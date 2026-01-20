import { useState, useCallback } from 'react';
import { GripVertical, X, Music, TrendingDown, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Song, FlowWarning } from '@/lib/types';
import { formatDuration, formatFullKey } from '@/lib/types';

interface SetlistBuilderProps {
  songs: Song[];
  songIds: string[];
  warnings: FlowWarning[];
  onReorder: (newSongIds: string[]) => void;
  onRemove: (songId: string) => void;
}

function EnergyIndicator({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all',
            i < level
              ? 'bg-gradient-to-t from-primary to-accent'
              : 'bg-muted-foreground/20',
            i === 0 && 'h-1.5',
            i === 1 && 'h-2',
            i === 2 && 'h-2.5',
            i === 3 && 'h-2',
            i === 4 && 'h-1.5'
          )}
        />
      ))}
    </div>
  );
}

function WarningBadge({ warning }: { warning: FlowWarning }) {
  const config = {
    'key-clash': {
      icon: Music,
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      label: 'Key clash',
    },
    'energy-drop': {
      icon: TrendingDown,
      className: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      label: 'Energy drop',
    },
    'slow-sequence': {
      icon: Gauge,
      className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      label: 'Slow sequence',
    },
  }[warning.type];

  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center justify-center w-5 h-5 rounded border',
            config.className
          )}
        >
          <Icon className="w-3 h-3" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground">{warning.message}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface SongItemProps {
  song: Song;
  index: number;
  warnings: FlowWarning[];
  onRemove: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

function SetlistSongItem({
  song,
  index,
  warnings,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
}: SongItemProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={cn(
        'flex items-center gap-2 px-2 py-2 md:px-3',
        'bg-card border border-border rounded-lg',
        'hover:border-primary/30 hover:bg-card/80',
        'transition-all duration-150',
        'animate-fade-in',
        isDragging && 'opacity-50 scale-95',
        isDragOver && 'border-primary bg-primary/5'
      )}
    >
      {/* Drag Handle */}
      <div className="drag-handle flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground touch-target shrink-0 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Song Number */}
      <div className="flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium text-muted-foreground shrink-0">
        {index + 1}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-sm font-medium truncate">{song.title}</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{formatDuration(song.durationSeconds)}</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">{song.bpm} BPM</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">{formatFullKey(song.musicalKey, song.keyMode)}</span>
        </div>
      </div>

      {/* Energy Indicator */}
      <div className="hidden sm:flex shrink-0">
        <EnergyIndicator level={song.energyLevel} />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          {warnings.map((warning, i) => (
            <WarningBadge key={`${warning.type}-${i}`} warning={warning} />
          ))}
        </div>
      )}

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
      >
        <X className="w-4 h-4" />
        <span className="sr-only">Remove from setlist</span>
      </Button>
    </div>
  );
}

export function SetlistBuilder({
  songs,
  songIds,
  warnings,
  onReorder,
  onRemove,
}: SetlistBuilderProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newSongIds = [...songIds];
      const [removed] = newSongIds.splice(dragIndex, 1);
      newSongIds.splice(dragOverIndex, 0, removed);
      onReorder(newSongIds);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex, songIds, onReorder]);

  const getWarningsForIndex = (index: number) => {
    return warnings.filter((w) => w.songIndex === index);
  };

  return (
    <div className="space-y-2">
      {songs.map((song, index) => (
        <SetlistSongItem
          key={song.id}
          song={song}
          index={index}
          warnings={getWarningsForIndex(index)}
          onRemove={() => onRemove(song.id)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          isDragging={dragIndex === index}
          isDragOver={dragOverIndex === index && dragIndex !== index}
        />
      ))}
    </div>
  );
}
