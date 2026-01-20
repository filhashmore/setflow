import { Pencil, Trash2, GripVertical, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Song, formatDuration, formatFullKey } from '@/lib/types';

interface SongCardProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (song: Song) => void;
  onClick?: (song: Song) => void;
  draggable?: boolean;
  onAddToSetlist?: () => void;
  isInSetlist?: boolean;
}

function EnergyIndicator({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-colors',
            i < level
              ? 'bg-gradient-to-r from-primary to-accent'
              : 'bg-muted-foreground/20'
          )}
        />
      ))}
    </div>
  );
}

export function SongCard({
  song,
  onEdit,
  onDelete,
  onClick,
  draggable = false,
  onAddToSetlist,
  isInSetlist = false,
}: SongCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(song);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(song);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(song);
  };

  const handleAddToSetlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToSetlist) {
      onAddToSetlist();
    }
  };

  return (
    <div
      className={cn(
        'glass-card rounded-lg p-3 sm:p-4',
        'transition-all duration-200 ease-out',
        'hover:border-primary/40 hover:bg-card/90 hover:scale-[1.01]',
        'group',
        onClick ? 'cursor-pointer' : '',
        isInSetlist ? 'border-primary/30 bg-primary/5' : ''
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        {draggable ? (
          <div className="drag-handle touch-target flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <GripVertical className="w-5 h-5" />
          </div>
        ) : null}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            {/* Title and Notes */}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate text-sm sm:text-base">
                {song.title}
              </h3>
              {song.notes ? (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {song.notes}
                </p>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {onAddToSetlist ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 transition-colors',
                    isInSetlist
                      ? 'text-primary hover:text-primary/80 hover:bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
                  )}
                  onClick={handleAddToSetlist}
                >
                  {isInSetlist ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span className="sr-only">
                    {isInSetlist ? 'In setlist' : 'Add to setlist'}
                  </span>
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/10"
                onClick={handleEdit}
              >
                <Pencil className="w-4 h-4" />
                <span className="sr-only">Edit song</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Delete song</span>
              </Button>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
            {/* Duration */}
            <span className="font-mono tabular-nums text-foreground/80">
              {formatDuration(song.durationSeconds)}
            </span>

            {/* BPM */}
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground/60 hidden sm:inline">BPM</span>
              <span className="font-mono tabular-nums">{song.bpm}</span>
            </span>

            {/* Key */}
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
              {formatFullKey(song.musicalKey, song.keyMode)}
            </span>

            {/* Energy Level */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground/60 hidden sm:inline text-xs">Energy</span>
              <EnergyIndicator level={song.energyLevel} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
