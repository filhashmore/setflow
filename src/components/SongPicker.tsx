import { useState, useMemo } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SongPickerItem } from './SongPickerItem';
import { cn } from '@/lib/utils';
import type { Song } from '@/lib/types';
import { formatDuration, areKeysClashing } from '@/lib/types';
import { Plus, Search, X, Music, ListMusic } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

interface SongPickerProps {
  songs: Song[];
  setlistSongIds: string[];
  onAddSong: (songId: string) => void;
  onRemoveSong: (songId: string) => void;
  lastSongInSetlist?: Song | null;
}

type SortOption = 'title' | 'bpm' | 'energy' | 'duration' | 'key';

export function SongPicker({
  songs,
  setlistSongIds,
  onAddSong,
  onRemoveSong,
  lastSongInSetlist,
}: SongPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Filter and sort songs
  const filteredSongs = useMemo(() => {
    let result = [...songs];

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(song =>
        song.title.toLowerCase().includes(searchLower) ||
        song.shortName.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'bpm':
          return a.bpm - b.bpm;
        case 'energy':
          return b.energyLevel - a.energyLevel; // High to low
        case 'duration':
          return a.durationSeconds - b.durationSeconds;
        case 'key':
          return a.musicalKey.localeCompare(b.musicalKey);
        default:
          return 0;
      }
    });

    return result;
  }, [songs, search, sortBy]);

  // Calculate stats
  const setlistSongs = songs.filter(s => setlistSongIds.includes(s.id));
  const totalDuration = setlistSongs.reduce((sum, s) => sum + s.durationSeconds, 0);
  const songCount = setlistSongIds.length;

  // Check for potential flow warning when adding a song
  const getFlowWarning = (song: Song): { hasWarning: boolean; message?: string } => {
    if (!lastSongInSetlist) return { hasWarning: false };

    // Check key clash
    if (areKeysClashing(
      lastSongInSetlist.musicalKey,
      lastSongInSetlist.keyMode,
      song.musicalKey,
      song.keyMode
    )) {
      return {
        hasWarning: true,
        message: `Key clash with ${lastSongInSetlist.title} (${lastSongInSetlist.musicalKey} → ${song.musicalKey})`,
      };
    }

    // Check energy drop
    const energyDrop = lastSongInSetlist.energyLevel - song.energyLevel;
    if (energyDrop > 2) {
      return {
        hasWarning: true,
        message: `Big energy drop from ${lastSongInSetlist.title} (${lastSongInSetlist.energyLevel} → ${song.energyLevel})`,
      };
    }

    return { hasWarning: false };
  };

  const handleToggleSong = (songId: string) => {
    if (setlistSongIds.includes(songId)) {
      onRemoveSong(songId);
    } else {
      onAddSong(songId);
    }
  };

  const pickerContent = (
    <div className="flex flex-col h-full">
      {/* Search and sort */}
      <div className="px-4 pb-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search songs..."
            className="pl-9 pr-9 h-10 bg-secondary border-border"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {([
            { value: 'title', label: 'A-Z' },
            { value: 'bpm', label: 'BPM' },
            { value: 'energy', label: 'Energy' },
            { value: 'duration', label: 'Length' },
            { value: 'key', label: 'Key' },
          ] as { value: SortOption; label: string }[]).map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                sortBy === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <span>{songCount} {songCount === 1 ? 'song' : 'songs'} in setlist</span>
          <span className="font-mono">{formatDuration(totalDuration)}</span>
        </div>
      </div>

      {/* Song list */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-4">
          {filteredSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="w-10 h-10 text-muted-foreground/50 mb-3" />
              {search ? (
                <>
                  <p className="text-sm font-medium">No songs found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different search term
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">No songs in library</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add songs to your library first
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredSongs.map((song) => {
              const isInSetlist = setlistSongIds.includes(song.id);
              const flowWarning = !isInSetlist ? getFlowWarning(song) : { hasWarning: false };

              return (
                <SongPickerItem
                  key={song.id}
                  song={song}
                  isInSetlist={isInSetlist}
                  hasFlowWarning={flowWarning.hasWarning}
                  flowWarningMessage={flowWarning.message}
                  onToggle={() => handleToggleSong(song.id)}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Use Drawer on mobile, Dialog on desktop
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5 h-9 shadow-sm">
            <Plus className="h-4 w-4" />
            Add Songs
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md h-[80vh] max-h-[700px] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <ListMusic className="h-5 w-5 text-primary" />
              Add Songs to Setlist
            </DialogTitle>
          </DialogHeader>
          {pickerContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" className="gap-1.5 h-9 shadow-sm">
          <Plus className="h-4 w-4" />
          Add Songs
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-3">
          <DrawerTitle className="flex items-center gap-2">
            <ListMusic className="h-5 w-5 text-primary" />
            Add Songs to Setlist
          </DrawerTitle>
        </DrawerHeader>
        {pickerContent}
      </DrawerContent>
    </Drawer>
  );
}
