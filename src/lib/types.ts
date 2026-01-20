// Musical keys
export const MUSICAL_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
] as const;

export const KEY_MODES = ['Major', 'Minor'] as const;

export type MusicalKey = typeof MUSICAL_KEYS[number];
export type KeyMode = typeof KEY_MODES[number];

// Song type
export interface Song {
  id: string;
  title: string;
  shortName: string; // abbreviated name for stage displays
  durationSeconds: number; // stored in seconds for easy math
  bpm: number;
  musicalKey: MusicalKey;
  keyMode: KeyMode;
  energyLevel: number; // 1-5
  notes: string;
  lightsNotes: string; // notes for lighting crew
  createdAt: number;
  updatedAt: number;
}

// Setlist type
export interface Setlist {
  id: string;
  name: string;
  songIds: string[];
  targetMinutes: number; // total slot time in minutes
  changeoverMinutes: number; // buffer time in minutes
  createdAt: number;
  updatedAt: number;
}

// Time status for visual indicators
export type TimeStatus = 'under' | 'good' | 'close' | 'over';

// Flow warning types
export type FlowWarningType = 'key-clash' | 'energy-drop' | 'slow-sequence';

export interface FlowWarning {
  type: FlowWarningType;
  songIndex: number;
  message: string;
}

// Helper functions
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function parseDuration(duration: string): number {
  const [mins, secs] = duration.split(':').map(Number);
  return (mins || 0) * 60 + (secs || 0);
}

export function formatFullKey(key: MusicalKey, mode: KeyMode): string {
  return `${key} ${mode === 'Major' ? 'maj' : 'min'}`;
}

// Key clash detection - checks if two keys are "clashing"
// Keys that are more than 5 semitones apart on the circle of fifths are considered clashing
const KEY_POSITIONS: Record<MusicalKey, number> = {
  'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5,
  'F#': 6, 'C#': 7, 'G#': 8, 'D#': 9, 'A#': 10, 'F': 11
};

export function areKeysClashing(
  key1: MusicalKey,
  mode1: KeyMode,
  key2: MusicalKey,
  mode2: KeyMode
): boolean {
  // If same key and mode, no clash
  if (key1 === key2 && mode1 === mode2) return false;

  // Get positions on circle of fifths
  const pos1 = KEY_POSITIONS[key1];
  const pos2 = KEY_POSITIONS[key2];

  // Calculate distance on circle of fifths (both directions)
  const distance = Math.min(
    Math.abs(pos1 - pos2),
    12 - Math.abs(pos1 - pos2)
  );

  // Keys more than 4 steps apart are considered clashing
  // (e.g., E to Db would be E to C# which is 4 steps - borderline)
  return distance > 4;
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
