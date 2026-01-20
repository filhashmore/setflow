import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  MUSICAL_KEYS,
  MusicalKey,
  KeyMode,
  parseDuration,
} from '@/lib/types';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { SongFormData } from './SongForm';

interface ImportSongsProps {
  onImport: (songs: SongFormData[]) => void;
}

interface ParsedSong {
  title: string;
  shortName: string;
  duration: string;
  bpm: string;
  musicalKey: string;
  energyLevel: string;
  lightsNotes: string;
  notes: string;
  isValid: boolean;
  errors: string[];
}

// Parse musical key string like "Gm", "C#", "Eb" into key and mode
function parseMusicalKey(keyStr: string): { key: MusicalKey; mode: KeyMode } | null {
  if (!keyStr) return null;

  const cleaned = keyStr.trim();

  // Check for minor indicator (m at end, not part of note name)
  const isMinor = cleaned.endsWith('m') && !cleaned.endsWith('#m') && cleaned.length > 1;
  const keyPart = isMinor ? cleaned.slice(0, -1) : cleaned;

  // Normalize key names (Eb -> D#, Bb -> A#, etc.)
  const keyMap: Record<string, MusicalKey> = {
    'C': 'C', 'C#': 'C#', 'Db': 'C#',
    'D': 'D', 'D#': 'D#', 'Eb': 'D#',
    'E': 'E', 'Fb': 'E',
    'F': 'F', 'F#': 'F#', 'Gb': 'F#',
    'G': 'G', 'G#': 'G#', 'Ab': 'G#',
    'A': 'A', 'A#': 'A#', 'Bb': 'A#',
    'B': 'B', 'Cb': 'B',
  };

  const normalizedKey = keyMap[keyPart];
  if (!normalizedKey) return null;

  return {
    key: normalizedKey,
    mode: isMinor ? 'Minor' : 'Major',
  };
}

// Parse energy level string like "4/5" or "4" into number 1-5
function parseEnergyLevel(energyStr: string): number | null {
  if (!energyStr) return null;

  const cleaned = energyStr.trim();

  // Handle "4/5" format
  if (cleaned.includes('/')) {
    const [value] = cleaned.split('/');
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 5) return num;
    return null;
  }

  // Handle plain number
  const num = parseInt(cleaned, 10);
  if (!isNaN(num) && num >= 1 && num <= 5) return num;

  return null;
}

// Parse duration string like "3:45" into seconds
function parseDurationString(durationStr: string): number | null {
  if (!durationStr) return null;

  const cleaned = durationStr.trim();
  const match = cleaned.match(/^(\d{1,3}):([0-5]?\d)$/);

  if (match) {
    const mins = parseInt(match[1], 10);
    const secs = parseInt(match[2], 10);
    return mins * 60 + secs;
  }

  return null;
}

// Parse BPM string
function parseBpm(bpmStr: string): number | null {
  if (!bpmStr) return null;

  const num = parseInt(bpmStr.trim(), 10);
  if (!isNaN(num) && num >= 1 && num <= 300) return num;

  return null;
}

// Parse HTML table into rows of data
function parseHtmlTable(html: string): string[][] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('tr');
  const data: string[][] = [];

  rows.forEach((row, index) => {
    // Skip header row (index 0) and freezebar row
    if (index === 0) return;
    if (row.classList.contains('freezebar-cell')) return;
    if (row.querySelector('th.freezebar-cell.freezebar-horizontal-handle')) return;

    const cells = row.querySelectorAll('td');
    const rowData: string[] = [];

    cells.forEach((cell) => {
      // Skip freezebar cells
      if (cell.classList.contains('freezebar-cell')) return;
      rowData.push(cell.textContent?.trim() || '');
    });

    // Only add rows that have at least a title
    if (rowData.length > 0 && rowData[0]) {
      data.push(rowData);
    }
  });

  return data;
}

// Parse CSV into rows of data
function parseCsv(csv: string): string[][] {
  const lines = csv.split('\n');
  const data: string[][] = [];

  lines.forEach((line, index) => {
    // Skip header row
    if (index === 0) return;

    // Simple CSV parsing (handles basic cases)
    const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));

    // Only add rows that have at least a title
    if (cells.length > 0 && cells[0]) {
      data.push(cells);
    }
  });

  return data;
}

// Validate and convert parsed row to song data
function validateRow(row: string[]): ParsedSong {
  const [title, shortName, duration, bpm, musicalKey, energyLevel, lightsNotes, notes] = row;

  const errors: string[] = [];

  // Title is required
  if (!title?.trim()) {
    errors.push('Title is required');
  }

  // Duration validation
  const parsedDuration = parseDurationString(duration);
  if (duration && !parsedDuration) {
    errors.push('Invalid duration format (use mm:ss)');
  }

  // BPM validation
  const parsedBpm = parseBpm(bpm);
  if (bpm && !parsedBpm) {
    errors.push('Invalid BPM (1-300)');
  }

  // Key validation
  const parsedKey = parseMusicalKey(musicalKey);
  if (musicalKey && !parsedKey) {
    errors.push('Invalid musical key');
  }

  // Energy validation
  const parsedEnergy = parseEnergyLevel(energyLevel);
  if (energyLevel && !parsedEnergy) {
    errors.push('Invalid energy level (1-5)');
  }

  return {
    title: title?.trim() || '',
    shortName: shortName?.trim() || '',
    duration: duration?.trim() || '',
    bpm: bpm?.trim() || '',
    musicalKey: musicalKey?.trim() || '',
    energyLevel: energyLevel?.trim() || '',
    lightsNotes: lightsNotes?.trim() || '',
    notes: notes?.trim() || '',
    isValid: errors.length === 0 && !!title?.trim(),
    errors,
  };
}

// Convert validated parsed song to SongFormData
function toSongFormData(parsed: ParsedSong): SongFormData {
  const keyInfo = parseMusicalKey(parsed.musicalKey);

  return {
    title: parsed.title,
    shortName: parsed.shortName,
    durationSeconds: parseDurationString(parsed.duration) || 0,
    bpm: parseBpm(parsed.bpm) || 120,
    musicalKey: keyInfo?.key || 'C',
    keyMode: keyInfo?.mode || 'Major',
    energyLevel: parseEnergyLevel(parsed.energyLevel) || 3,
    lightsNotes: parsed.lightsNotes,
    notes: parsed.notes,
  };
}

// Generate CSV template
function generateCsvTemplate(): string {
  const headers = ['Song Title', 'Short Name', 'Duration', 'BPM', 'Musical Key', 'Energy Level', 'Lights Notes', 'Notes'];
  const exampleRow = ['Example Song', 'EX', '3:45', '120', 'C', '3/5', 'Blue wash', 'Opening track'];

  return [headers.join(','), exampleRow.join(',')].join('\n');
}

// Download formats
type DownloadFormat = 'csv' | 'tsv';

export function ImportSongs({ onImport }: ImportSongsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedSongs, setParsedSongs] = useState<ParsedSong[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    let rows: string[][];

    if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
      rows = parseHtmlTable(text);
    } else if (file.name.endsWith('.csv')) {
      rows = parseCsv(text);
    } else if (file.name.endsWith('.tsv') || file.name.endsWith('.txt')) {
      // TSV parsing
      rows = text.split('\n').slice(1).map(line => line.split('\t').map(c => c.trim())).filter(r => r[0]);
    } else {
      // Try to detect format
      if (text.includes('<table') || text.includes('<tr')) {
        rows = parseHtmlTable(text);
      } else if (text.includes('\t')) {
        rows = text.split('\n').slice(1).map(line => line.split('\t').map(c => c.trim())).filter(r => r[0]);
      } else {
        rows = parseCsv(text);
      }
    }

    const parsed = rows.map(validateRow);
    setParsedSongs(parsed);
    setStep('preview');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleImport = () => {
    const validSongs = parsedSongs
      .filter(s => s.isValid && s.title)
      .map(toSongFormData);

    if (validSongs.length > 0) {
      onImport(validSongs);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setParsedSongs([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = (format: DownloadFormat) => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      content = generateCsvTemplate();
      filename = 'setflow-template.csv';
      mimeType = 'text/csv';
    } else {
      // TSV
      const headers = ['Song Title', 'Short Name', 'Duration', 'BPM', 'Musical Key', 'Energy Level', 'Lights Notes', 'Notes'];
      const exampleRow = ['Example Song', 'EX', '3:45', '120', 'C', '3/5', 'Blue wash', 'Opening track'];
      content = [headers.join('\t'), exampleRow.join('\t')].join('\n');
      filename = 'setflow-template.tsv';
      mimeType = 'text/tab-separated-values';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedSongs.filter(s => s.isValid).length;
  const invalidCount = parsedSongs.filter(s => !s.isValid).length;
  const missingDuration = parsedSongs.filter(s => s.isValid && !s.duration).length;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 h-9"
      >
        <Upload className="h-4 w-4" />
        <span className="hidden xs:inline">Import</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Import Songs
            </DialogTitle>
            <DialogDescription>
              Import songs from a spreadsheet file (CSV, TSV, or HTML from Google Sheets)
            </DialogDescription>
          </DialogHeader>

          {step === 'upload' && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  dragActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Drop your file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports CSV, TSV, or HTML (exported from Google Sheets)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.html,.htm"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {/* Template download */}
              <div className="border border-border rounded-xl p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Need a template?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Download a template with the correct column headers
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadTemplate('csv')}
                        className="h-8 text-xs"
                      >
                        Download CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadTemplate('tsv')}
                        className="h-8 text-xs"
                      >
                        Download TSV
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Format tips */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Column order:</strong> Song Title, Short Name, Duration, BPM, Musical Key, Energy Level, Lights Notes, Notes</p>
                <p><strong>Duration:</strong> Use mm:ss format (e.g., 3:45)</p>
                <p><strong>Musical Key:</strong> Use letter + optional # or b + optional m for minor (e.g., C, F#, Gm, Ebm)</p>
                <p><strong>Energy Level:</strong> 1-5 or 1/5 format</p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Summary */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{validCount} ready to import</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{invalidCount} with errors</span>
                  </div>
                )}
                {missingDuration > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{missingDuration} missing duration</span>
                  </div>
                )}
              </div>

              {/* Song list */}
              <div className="flex-1 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                {parsedSongs.map((song, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 text-sm",
                      !song.isValid && "bg-destructive/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{song.title || '(No title)'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[
                            song.duration && `${song.duration}`,
                            song.bpm && `${song.bpm} BPM`,
                            song.musicalKey,
                            song.energyLevel && `Energy ${song.energyLevel}`,
                          ].filter(Boolean).join(' • ') || 'No data'}
                        </p>
                      </div>
                      {song.isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                    </div>
                    {song.errors.length > 0 && (
                      <p className="text-xs text-destructive mt-1">{song.errors.join(', ')}</p>
                    )}
                    {song.isValid && !song.duration && (
                      <p className="text-xs text-yellow-600 mt-1">Missing duration - cannot add to setlist until duration is set</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => { setStep('upload'); setParsedSongs([]); }}
                  className="flex-1 sm:flex-none"
                >
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validCount === 0}
                  className="flex-1 sm:flex-none sm:ml-auto"
                >
                  Import {validCount} {validCount === 1 ? 'Song' : 'Songs'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
