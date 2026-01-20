import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSongs, useSetlists, calculateFlowWarnings } from '@/lib/store';
import type { Song } from '@/lib/types';
import { formatDuration } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus,
  ListMusic,
  FileText,
  Library,
  ChevronRight
} from 'lucide-react';
import { SongForm } from '@/components/SongForm';
import type { SongFormData } from '@/components/SongForm';
import { SongCard } from '@/components/SongCard';
import { ImportSongs } from '@/components/ImportSongs';
import { SetlistBuilder } from '@/components/SetlistBuilder';
import { ExportView } from '@/components/ExportView';
import { TimeDisplay } from '@/components/TimeDisplay';
import { SetlistSettings } from '@/components/SetlistSettings';
import { SetFlowLogo } from '@/components/SetFlowLogo';
import { AppearanceSettingsSheet, useAppearance } from '@/components/AppearanceSettings';
import { SongPicker } from '@/components/SongPicker';
import { cn } from '@/lib/utils';

type View = 'library' | 'setlist';

export default function Index() {
  const { songs, addSong, updateSong, deleteSong } = useSongs();
  const {
    setlists,
    activeSetlist,
    activeSetlistId,
    setActiveSetlistId,
    createSetlist,
    updateSetlist,
    deleteSetlist
  } = useSetlists();

  const { settings: appearanceSettings, updateAccentColor } = useAppearance();

  // Default to setlist view if user has songs (returning user), otherwise library
  const [currentView, setCurrentView] = useState<View>(() => {
    // Check localStorage directly for initial state to avoid flash
    try {
      const storedSongs = localStorage.getItem('setflow-songs');
      const hasSongs = storedSongs && JSON.parse(storedSongs).length > 0;
      return hasSongs ? 'setlist' : 'library';
    } catch {
      return 'library';
    }
  });
  const [songFormOpen, setSongFormOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showExport, setShowExport] = useState(false);

  // Calculate setlist stats
  const setlistSongs = useMemo(() => {
    if (!activeSetlist) return [];
    return activeSetlist.songIds
      .map(id => songs.find(s => s.id === id))
      .filter((s): s is Song => s !== undefined);
  }, [activeSetlist, songs]);

  const totalSeconds = useMemo(() =>
    setlistSongs.reduce((sum, song) => sum + song.durationSeconds, 0),
    [setlistSongs]
  );

  const warnings = useMemo(() =>
    activeSetlist ? calculateFlowWarnings(activeSetlist.songIds, songs) : [],
    [activeSetlist, songs]
  );

  // Handlers
  const handleAddSong = useCallback((songData: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>) => {
    addSong(songData);
    setSongFormOpen(false);
  }, [addSong]);

  const handleImportSongs = useCallback((songsData: SongFormData[]) => {
    songsData.forEach(songData => {
      addSong(songData);
    });
  }, [addSong]);

  const handleEditSong = useCallback((songData: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSong) {
      updateSong(editingSong.id, songData);
      setEditingSong(null);
    }
  }, [editingSong, updateSong]);

  const handleDeleteSong = useCallback((id: string) => {
    deleteSong(id);
    setlists.forEach(setlist => {
      if (setlist.songIds.includes(id)) {
        updateSetlist(setlist.id, {
          songIds: setlist.songIds.filter(sid => sid !== id)
        });
      }
    });
  }, [deleteSong, setlists, updateSetlist]);

  const handleCreateSetlist = useCallback(() => {
    const newSetlist = createSetlist(`Setlist ${setlists.length + 1}`);
    setActiveSetlistId(newSetlist.id);
    setCurrentView('setlist');
  }, [createSetlist, setlists.length, setActiveSetlistId]);

  const handleAddToSetlist = useCallback((songId: string) => {
    if (!activeSetlist) {
      const newSetlist = createSetlist('New Setlist');
      updateSetlist(newSetlist.id, { songIds: [songId] });
      setActiveSetlistId(newSetlist.id);
    } else {
      if (!activeSetlist.songIds.includes(songId)) {
        updateSetlist(activeSetlist.id, {
          songIds: [...activeSetlist.songIds, songId]
        });
      }
    }
  }, [activeSetlist, createSetlist, updateSetlist, setActiveSetlistId]);

  const handleReorderSongs = useCallback((newSongIds: string[]) => {
    if (activeSetlist) {
      updateSetlist(activeSetlist.id, { songIds: newSongIds });
    }
  }, [activeSetlist, updateSetlist]);

  const handleRemoveFromSetlist = useCallback((songId: string) => {
    if (activeSetlist) {
      updateSetlist(activeSetlist.id, {
        songIds: activeSetlist.songIds.filter(id => id !== songId)
      });
    }
  }, [activeSetlist, updateSetlist]);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-inset">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl safe-top">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            {/* Logo */}
            <SetFlowLogo size="sm" showText className="shrink-0" />

            {/* Navigation */}
            <nav className="flex items-center gap-1 flex-1 justify-center sm:justify-end">
              <Button
                variant={currentView === 'library' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('library')}
                className={cn(
                  "gap-1.5 h-9 px-3 font-medium transition-all",
                  currentView === 'library' && "shadow-sm"
                )}
              >
                <Library className="h-4 w-4" />
                Library
              </Button>
              <Button
                variant={currentView === 'setlist' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('setlist')}
                className={cn(
                  "gap-1.5 h-9 px-3 font-medium transition-all",
                  currentView === 'setlist' && "shadow-sm"
                )}
              >
                <ListMusic className="h-4 w-4" />
                Setlist
                {activeSetlist && activeSetlist.songIds.length > 0 && (
                  <span className="min-w-[1.25rem] h-5 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center">
                    {activeSetlist.songIds.length}
                  </span>
                )}
              </Button>
              {activeSetlist && activeSetlist.songIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExport(true)}
                  className="gap-1.5 h-9 px-3"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              )}
            </nav>

            {/* Settings */}
            <AppearanceSettingsSheet
              settings={appearanceSettings}
              onUpdateAccent={updateAccentColor}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-4 sm:py-6 safe-bottom">
        {/* Library View */}
        {currentView === 'library' && (
          <div className="animate-fade-in space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Song Library</h2>
                <p className="text-sm text-muted-foreground">
                  {songs.length} {songs.length === 1 ? 'song' : 'songs'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ImportSongs onImport={handleImportSongs} />
                <Button onClick={() => setSongFormOpen(true)} size="sm" className="gap-1.5 h-9 shadow-sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden xs:inline">Add</span> Song
                </Button>
              </div>
            </div>

            {songs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 py-12 sm:py-16">
                <div className="mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-4">
                  <ListMusic className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">No songs yet</h3>
                <p className="mb-5 text-center text-sm text-muted-foreground max-w-[240px]">
                  Add your first song or import from a spreadsheet
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button onClick={() => setSongFormOpen(true)} className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" />
                    Add Your First Song
                  </Button>
                  <ImportSongs onImport={handleImportSongs} />
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {songs.map((song, index) => (
                  <div
                    key={song.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                  >
                    <SongCard
                      song={song}
                      onEdit={() => setEditingSong(song)}
                      onDelete={() => handleDeleteSong(song.id)}
                      onAddToSetlist={() => handleAddToSetlist(song.id)}
                      isInSetlist={activeSetlist?.songIds.includes(song.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Setlist View */}
        {currentView === 'setlist' && (
          <div className="animate-fade-in space-y-5">
            {!activeSetlist ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 py-12 sm:py-16">
                <div className="mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-4">
                  <ListMusic className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">No setlist selected</h3>
                <p className="mb-5 text-center text-sm text-muted-foreground max-w-[240px]">
                  Create a new setlist to start planning your show
                </p>
                <Button onClick={handleCreateSetlist} className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Create Setlist
                </Button>
              </div>
            ) : (
              <>
                {/* Setlist Header with Time Display */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={activeSetlist.name}
                        onChange={(e) => updateSetlist(activeSetlist.id, { name: e.target.value })}
                        className="flex-1 min-w-0 bg-transparent text-lg sm:text-xl font-semibold outline-none focus:ring-2 focus:ring-primary/50 rounded px-1 -ml-1 truncate"
                      />
                      <SongPicker
                        songs={songs}
                        setlistSongIds={activeSetlist.songIds}
                        onAddSong={handleAddToSetlist}
                        onRemoveSong={handleRemoveFromSetlist}
                        lastSongInSetlist={setlistSongs.length > 0 ? setlistSongs[setlistSongs.length - 1] : null}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {setlistSongs.length} {setlistSongs.length === 1 ? 'song' : 'songs'} • {formatDuration(totalSeconds)}
                    </p>
                  </div>

                  <TimeDisplay
                    totalSeconds={totalSeconds}
                    targetMinutes={activeSetlist.targetMinutes}
                    changeoverMinutes={activeSetlist.changeoverMinutes}
                  />
                </div>

                {/* Setlist Settings */}
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <SetlistSettings
                    targetMinutes={activeSetlist.targetMinutes}
                    changeoverMinutes={activeSetlist.changeoverMinutes}
                    onUpdate={(values) =>
                      updateSetlist(activeSetlist.id, {
                        targetMinutes: values.targetMinutes,
                        changeoverMinutes: values.changeoverMinutes
                      })
                    }
                  />
                </div>

                {/* Setlist Builder */}
                {setlistSongs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-10">
                    <p className="mb-3 text-sm text-muted-foreground">
                      Your setlist is empty
                    </p>
                    <SongPicker
                      songs={songs}
                      setlistSongIds={activeSetlist.songIds}
                      onAddSong={handleAddToSetlist}
                      onRemoveSong={handleRemoveFromSetlist}
                      lastSongInSetlist={null}
                    />
                  </div>
                ) : (
                  <SetlistBuilder
                    songs={setlistSongs}
                    songIds={activeSetlist.songIds}
                    warnings={warnings}
                    onReorder={handleReorderSongs}
                    onRemove={handleRemoveFromSetlist}
                  />
                )}

                {/* Setlist Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {setlistSongs.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExport(true)}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Export Setlist
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this setlist?')) {
                        deleteSetlist(activeSetlist.id);
                      }
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Delete Setlist
                  </Button>
                </div>
              </>
            )}

            {/* Other Setlists */}
            {setlists.length > 1 && (
              <div className="pt-4 mt-2 border-t border-border/50">
                <h3 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Other Setlists</h3>
                <div className="flex flex-wrap gap-2">
                  {setlists
                    .filter(s => s.id !== activeSetlistId)
                    .map(setlist => (
                      <Button
                        key={setlist.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveSetlistId(setlist.id)}
                        className="h-8"
                      >
                        {setlist.name}
                        <span className="ml-1.5 text-muted-foreground">
                          ({setlist.songIds.length})
                        </span>
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Song Form Dialog */}
      <Dialog open={songFormOpen || !!editingSong} onOpenChange={(open) => {
        if (!open) {
          setSongFormOpen(false);
          setEditingSong(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <SongForm
            song={editingSong || undefined}
            onSubmit={editingSong ? handleEditSong : handleAddSong}
            onCancel={() => {
              setSongFormOpen(false);
              setEditingSong(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Setlist</DialogTitle>
          </DialogHeader>
          {activeSetlist && (
            <ExportView
              setlist={activeSetlist}
              songs={songs}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
