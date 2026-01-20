# SetFlow - Setlist Planner for Musicians

A web app that helps touring musicians and music directors plan setlists with timing precision.

## Features

### Song Library
- Add songs with: title, duration (mm:ss), BPM, musical key (C through B with major/minor), energy level (1-5), and notes
- **Short Name**: Abbreviated name for stage displays and PDF exports
- **Lights Notes**: Special field for lighting crew instructions (cues, colors, effects)
- Edit and delete songs
- Quick-add songs to the active setlist with visual indicator

### Setlist Builder
- Drag-and-drop interface to arrange songs
- Live running total time that updates as songs are reordered
- Visual flow indicators with warnings for:
  - **Key clashes**: Adjacent songs more than 4 steps apart on the circle of fifths
  - **Energy drops**: Energy level drop greater than 2 between songs
  - **Slow sequences**: Three or more consecutive slow songs (BPM < 90)
- Remove songs from setlist with one click

### Target Time Calculator
- Set total slot time and changeover buffer
- See calculated target music time
- Color-coded status indicator:
  - **Green (On Target)**: Within tolerance
  - **Yellow (Close)**: Within 2 minutes over
  - **Red (Over)**: More than 2 minutes over target
  - **Blue (Under)**: More than 2 minutes under target

### Export
- **PDF Export** with customizable options:
  - Text header (band name) OR horizontal logo upload
  - Subtitle text (venue, date, tour name, etc.)
  - Square footer logo (1:1 aspect ratio, bottom right corner)
  - Centered setlist format: `short name - song name - key`
- **Copy to Clipboard**: Plain text version for quick sharing
- All export settings are saved between sessions

### Appearance Settings
- 8 customizable accent colors (Purple, Blue, Cyan, Teal, Green, Orange, Red, Pink)
- Settings persisted across sessions via localStorage

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui component library
- **PDF Generation**: jsPDF
- **Storage**: localStorage for all data persistence (no backend required)
- **Build Tool**: Vite

## Project Structure

```
webapp/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── AppearanceSettings.tsx # Accent color picker
│   │   ├── ExportView.tsx         # PDF export and clipboard
│   │   ├── SetFlowLogo.tsx        # Animated app logo
│   │   ├── SetlistBuilder.tsx     # Drag-and-drop setlist editor
│   │   ├── SetlistSettings.tsx    # Target time settings
│   │   ├── SongCard.tsx           # Song display card
│   │   ├── SongForm.tsx           # Add/edit song form
│   │   └── TimeDisplay.tsx        # Time status display
│   ├── lib/
│   │   ├── store.ts               # localStorage hooks and flow warnings
│   │   ├── types.ts               # TypeScript types and helpers
│   │   └── utils.ts               # Utility functions
│   ├── pages/
│   │   └── Index.tsx              # Main app page
│   ├── index.css                  # Design system and custom styles
│   └── main.tsx                   # App entry point
├── tailwind.config.ts             # Tailwind configuration
└── package.json
```

## Design System

- **Dark mode by default**: Easier to read backstage and onstage
- **Custom accent colors**: Dynamically applied via CSS variables
- **Animated logo**: Equalizer bars representing musical flow
- **Typography**:
  - Outfit font for UI text
  - JetBrains Mono for timing displays
- **Mobile-first**: Large touch targets (44px minimum)
- **Safe area support**: Proper padding for notched devices (iPhone, iPad)
- **Glass card effects**: Subtle backdrop blur on cards
- **Gradient accents**: Primary to accent color gradients

## Data Storage

All data is stored in the browser's localStorage:

| Key | Description |
|-----|-------------|
| `setflow-songs` | Array of all songs in the library |
| `setflow-setlists` | Array of all setlists |
| `setflow-active-setlist` | ID of the currently selected setlist |
| `setflow-appearance` | Accent color preference |
| `setflow-export-settings` | PDF export settings (logos, text options) |

## Key Types

```typescript
interface Song {
  id: string;
  title: string;
  shortName: string;           // For stage displays
  durationSeconds: number;
  bpm: number;
  musicalKey: MusicalKey;      // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
  keyMode: KeyMode;            // Major | Minor
  energyLevel: number;         // 1-5
  notes: string;
  lightsNotes: string;         // For lighting crew
  createdAt: number;
  updatedAt: number;
}

interface Setlist {
  id: string;
  name: string;
  songIds: string[];
  targetMinutes: number;       // Total slot time
  changeoverMinutes: number;   // Buffer for setup
  createdAt: number;
  updatedAt: number;
}
```

## Flow Warning Logic

1. **Key Clash Detection**: Uses the circle of fifths to determine harmonic distance. Keys more than 4 steps apart are flagged.

2. **Energy Drop**: Flags when energy level drops by more than 2 levels between adjacent songs.

3. **Slow Sequence**: Flags when 3 or more consecutive songs have BPM below 90.

## Running Locally

```bash
cd webapp
bun install
bun run dev
```

The app runs on port 8000 by default.
