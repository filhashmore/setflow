# SetFlow

Setlist builder app for musicians and production managers. Create song libraries, build setlists with drag-and-drop, get flow warnings (key clashes, energy drops), and export to PDF.

## Tech Stack

- **Frontend:** React 18, Vite 5, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui, Framer Motion
- **Icons:** Lucide React
- **State:** localStorage (no backend needed)
- **Deployment:** Vercel

## Development

```bash
npm install
npm run dev      # Start dev server on http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── components/     # React components
│   ├── ui/         # shadcn/ui components
│   └── ...         # App-specific components
├── lib/            # Utilities, types, store
├── pages/          # Page components
└── hooks/          # Custom hooks
```

## Key Features

- **Song Library:** Add songs with title, artist, duration, BPM, key, energy level
- **Setlist Builder:** Drag-and-drop reordering
- **Flow Warnings:** Detects key clashes, energy drops, slow sequences
- **Time Tracking:** Target time vs actual with changeover buffer
- **Export:** PDF export for stage/FOH use

## Notes

- All data persists in localStorage (`setflow-songs`, `setflow-setlists`)
- No authentication or backend required
- Mobile-responsive design
