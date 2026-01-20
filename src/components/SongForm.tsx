import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Song,
  MUSICAL_KEYS,
  KEY_MODES,
  MusicalKey,
  KeyMode,
  parseDuration,
  formatDuration,
} from '@/lib/types';
import { Music, Clock, Activity, Zap, FileText } from 'lucide-react';

// Song data without id and timestamps (for create/update)
export interface SongFormData {
  title: string;
  shortName: string;
  durationSeconds: number;
  bpm: number;
  musicalKey: MusicalKey;
  keyMode: KeyMode;
  energyLevel: number;
  notes: string;
  lightsNotes: string;
}

interface SongFormProps {
  song?: Song;
  onSubmit: (data: SongFormData) => void;
  onCancel: () => void;
}

// Duration input validation pattern (mm:ss or m:ss)
const DURATION_REGEX = /^(\d{1,3}):([0-5]\d)$/;

export function SongForm({ song, onSubmit, onCancel }: SongFormProps) {
  const [title, setTitle] = useState(song?.title ?? '');
  const [shortName, setShortName] = useState(song?.shortName ?? '');
  const [duration, setDuration] = useState(
    song ? formatDuration(song.durationSeconds) : ''
  );
  const [durationError, setDurationError] = useState<string | null>(null);
  const [bpm, setBpm] = useState(song?.bpm?.toString() ?? '');
  const [musicalKey, setMusicalKey] = useState<MusicalKey>(
    song?.musicalKey ?? 'C'
  );
  const [keyMode, setKeyMode] = useState<KeyMode>(song?.keyMode ?? 'Major');
  const [energyLevel, setEnergyLevel] = useState(song?.energyLevel ?? 3);
  const [notes, setNotes] = useState(song?.notes ?? '');
  const [lightsNotes, setLightsNotes] = useState(song?.lightsNotes ?? '');

  // Validate duration on blur
  const validateDuration = (value: string): boolean => {
    if (!value.trim()) {
      setDurationError('Duration is required');
      return false;
    }
    if (!DURATION_REGEX.test(value)) {
      setDurationError('Use mm:ss format (e.g., 3:45)');
      return false;
    }
    setDurationError(null);
    return true;
  };

  // Handle duration input with auto-formatting
  const handleDurationChange = (value: string) => {
    // Allow only numbers and colon
    const cleaned = value.replace(/[^\d:]/g, '');
    setDuration(cleaned);
    if (durationError) {
      setDurationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!title.trim()) {
      return;
    }

    if (!validateDuration(duration)) {
      return;
    }

    const bpmValue = parseInt(bpm, 10);
    if (isNaN(bpmValue) || bpmValue < 1 || bpmValue > 300) {
      return;
    }

    onSubmit({
      title: title.trim(),
      shortName: shortName.trim(),
      durationSeconds: parseDuration(duration),
      bpm: bpmValue,
      musicalKey,
      keyMode,
      energyLevel,
      notes: notes.trim(),
      lightsNotes: lightsNotes.trim(),
    });
  };

  const isEditing = !!song;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-2">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border sticky top-0 bg-card z-10">
        <Music className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {isEditing ? 'Edit Song' : 'Add Song'}
        </h2>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-foreground">
          Song Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter song title"
          className="h-12 bg-secondary border-border focus:border-primary focus:ring-primary"
          required
        />
      </div>

      {/* Short Name */}
      <div className="space-y-2">
        <Label htmlFor="shortName" className="text-sm font-medium text-foreground flex items-center gap-1.5">
          Short Name
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="shortName"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          placeholder="Abbreviated name for stage displays"
          className="h-12 bg-secondary border-border focus:border-primary focus:ring-primary"
        />
      </div>

      {/* Duration and BPM row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="duration"
            className="text-sm font-medium text-foreground flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-muted-foreground" />
            Duration
          </Label>
          <Input
            id="duration"
            value={duration}
            onChange={(e) => handleDurationChange(e.target.value)}
            onBlur={() => validateDuration(duration)}
            placeholder="3:45"
            className={cn(
              'h-12 bg-secondary border-border focus:border-primary focus:ring-primary font-mono-display',
              durationError && 'border-destructive focus:border-destructive'
            )}
            required
          />
          {durationError ? (
            <p className="text-xs text-destructive">{durationError}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="bpm"
            className="text-sm font-medium text-foreground flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4 text-muted-foreground" />
            BPM
          </Label>
          <Input
            id="bpm"
            type="number"
            min={1}
            max={300}
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            placeholder="120"
            className="h-12 bg-secondary border-border focus:border-primary focus:ring-primary font-mono-display"
            required
          />
        </div>
      </div>

      {/* Musical Key and Mode row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Musical Key
          </Label>
          <Select
            value={musicalKey}
            onValueChange={(value) => setMusicalKey(value as MusicalKey)}
          >
            <SelectTrigger className="h-12 bg-secondary border-border focus:border-primary focus:ring-primary">
              <SelectValue placeholder="Select key" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {MUSICAL_KEYS.map((key) => (
                <SelectItem
                  key={key}
                  value={key}
                  className="focus:bg-primary/20 focus:text-foreground"
                >
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Mode</Label>
          <div className="flex h-12 rounded-lg border border-border bg-secondary overflow-hidden">
            {KEY_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setKeyMode(mode)}
                className={cn(
                  'flex-1 text-sm font-medium transition-all touch-target',
                  keyMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Energy Level */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-muted-foreground" />
          Energy Level
        </Label>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Slider
              value={[energyLevel]}
              onValueChange={(value) => setEnergyLevel(value[0])}
              min={1}
              max={5}
              step={1}
              className="flex-1"
            />
            <span className="text-lg font-semibold text-primary w-8 text-center">
              {energyLevel}
            </span>
          </div>
          {/* Energy level indicators */}
          <div className="flex justify-between px-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setEnergyLevel(level)}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-all touch-target',
                  level <= energyLevel
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary text-muted-foreground hover:bg-muted'
                )}
              >
                <Zap
                  className={cn(
                    'w-5 h-5 transition-all',
                    level <= energyLevel ? 'fill-primary' : ''
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label
          htmlFor="notes"
          className="text-sm font-medium text-foreground flex items-center gap-1.5"
        >
          <FileText className="w-4 h-4 text-muted-foreground" />
          Notes
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this song..."
          className="min-h-[80px] bg-secondary border-border focus:border-primary focus:ring-primary resize-none"
          rows={2}
        />
      </div>

      {/* Lights Notes */}
      <div className="space-y-2">
        <Label
          htmlFor="lightsNotes"
          className="text-sm font-medium text-foreground flex items-center gap-1.5"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          Lights Notes
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="lightsNotes"
          value={lightsNotes}
          onChange={(e) => setLightsNotes(e.target.value)}
          placeholder="Notes for the lighting crew (cues, colors, effects...)"
          className="min-h-[80px] bg-secondary border-border focus:border-primary focus:ring-primary resize-none"
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 touch-target"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 bg-primary hover:bg-primary/90 glow-primary touch-target"
        >
          {isEditing ? 'Save Changes' : 'Add Song'}
        </Button>
      </div>
    </form>
  );
}
