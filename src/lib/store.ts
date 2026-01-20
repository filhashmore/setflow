import { useState, useEffect, useCallback } from 'react';
import type { Song, Setlist, FlowWarning } from './types';
import { generateId, areKeysClashing } from './types';

const STORAGE_KEYS = {
  SONGS: 'setflow-songs',
  SETLISTS: 'setflow-setlists',
  ACTIVE_SETLIST: 'setflow-active-setlist',
} as const;

// Load from localStorage with fallback
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

// Save to localStorage
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Songs store hook
export function useSongs() {
  const [songs, setSongs] = useState<Song[]>(() =>
    loadFromStorage(STORAGE_KEYS.SONGS, [])
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SONGS, songs);
  }, [songs]);

  const addSong = useCallback((song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const newSong: Song = {
      ...song,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setSongs(prev => [...prev, newSong]);
    return newSong;
  }, []);

  const updateSong = useCallback((id: string, updates: Partial<Omit<Song, 'id' | 'createdAt'>>) => {
    setSongs(prev =>
      prev.map(song =>
        song.id === id
          ? { ...song, ...updates, updatedAt: Date.now() }
          : song
      )
    );
  }, []);

  const deleteSong = useCallback((id: string) => {
    setSongs(prev => prev.filter(song => song.id !== id));
  }, []);

  const getSongById = useCallback(
    (id: string) => songs.find(song => song.id === id),
    [songs]
  );

  return {
    songs,
    addSong,
    updateSong,
    deleteSong,
    getSongById,
  };
}

// Setlists store hook
export function useSetlists() {
  const [setlists, setSetlists] = useState<Setlist[]>(() =>
    loadFromStorage(STORAGE_KEYS.SETLISTS, [])
  );

  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(() =>
    loadFromStorage(STORAGE_KEYS.ACTIVE_SETLIST, null)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETLISTS, setlists);
  }, [setlists]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_SETLIST, activeSetlistId);
  }, [activeSetlistId]);

  const createSetlist = useCallback((name: string) => {
    const now = Date.now();
    const newSetlist: Setlist = {
      id: generateId(),
      name,
      songIds: [],
      targetMinutes: 60,
      changeoverMinutes: 5,
      createdAt: now,
      updatedAt: now,
    };
    setSetlists(prev => [...prev, newSetlist]);
    return newSetlist;
  }, []);

  const updateSetlist = useCallback((id: string, updates: Partial<Omit<Setlist, 'id' | 'createdAt'>>) => {
    setSetlists(prev =>
      prev.map(setlist =>
        setlist.id === id
          ? { ...setlist, ...updates, updatedAt: Date.now() }
          : setlist
      )
    );
  }, []);

  const deleteSetlist = useCallback((id: string) => {
    setSetlists(prev => prev.filter(setlist => setlist.id !== id));
    if (activeSetlistId === id) {
      setActiveSetlistId(null);
    }
  }, [activeSetlistId]);

  const activeSetlist = setlists.find(s => s.id === activeSetlistId) || null;

  return {
    setlists,
    activeSetlist,
    activeSetlistId,
    setActiveSetlistId,
    createSetlist,
    updateSetlist,
    deleteSetlist,
  };
}

// Calculate flow warnings for a setlist
export function calculateFlowWarnings(songIds: string[], songs: Song[]): FlowWarning[] {
  const warnings: FlowWarning[] = [];
  const setlistSongs = songIds
    .map(id => songs.find(s => s.id === id))
    .filter((s): s is Song => s !== undefined);

  for (let i = 1; i < setlistSongs.length; i++) {
    const prevSong = setlistSongs[i - 1];
    const currentSong = setlistSongs[i];

    // Check for key clash
    if (areKeysClashing(
      prevSong.musicalKey,
      prevSong.keyMode,
      currentSong.musicalKey,
      currentSong.keyMode
    )) {
      warnings.push({
        type: 'key-clash',
        songIndex: i,
        message: `Key clash: ${prevSong.musicalKey} ${prevSong.keyMode} → ${currentSong.musicalKey} ${currentSong.keyMode}`,
      });
    }

    // Check for energy drop > 2 levels
    const energyDrop = prevSong.energyLevel - currentSong.energyLevel;
    if (energyDrop > 2) {
      warnings.push({
        type: 'energy-drop',
        songIndex: i,
        message: `Energy drop: ${prevSong.energyLevel} → ${currentSong.energyLevel}`,
      });
    }
  }

  // Check for 3+ consecutive slow songs (BPM < 90)
  let slowCount = 0;
  for (let i = 0; i < setlistSongs.length; i++) {
    if (setlistSongs[i].bpm < 90) {
      slowCount++;
      if (slowCount >= 3) {
        warnings.push({
          type: 'slow-sequence',
          songIndex: i,
          message: '3+ consecutive slow songs (BPM < 90)',
        });
        // Only warn once per sequence
        while (i + 1 < setlistSongs.length && setlistSongs[i + 1].bpm < 90) {
          i++;
        }
      }
    } else {
      slowCount = 0;
    }
  }

  return warnings;
}

// Calculate time status
export function calculateTimeStatus(
  totalSeconds: number,
  targetMinutes: number,
  changeoverMinutes: number
): { status: 'under' | 'good' | 'close' | 'over'; targetSeconds: number; difference: number } {
  const targetSeconds = (targetMinutes - changeoverMinutes) * 60;
  const difference = totalSeconds - targetSeconds;
  const toleranceSeconds = 120; // 2 minutes tolerance

  let status: 'under' | 'good' | 'close' | 'over';
  if (difference > toleranceSeconds) {
    status = 'over';
  } else if (difference > 0) {
    status = 'close';
  } else if (difference >= -toleranceSeconds) {
    status = 'good';
  } else {
    status = 'under';
  }

  return { status, targetSeconds, difference };
}
