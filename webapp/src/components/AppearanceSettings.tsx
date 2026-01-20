import { useState, useEffect, useCallback } from 'react';
import { Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Predefined accent colors
const ACCENT_COLORS = [
  { name: 'Purple', hue: 263, class: 'bg-purple-500' },
  { name: 'Blue', hue: 217, class: 'bg-blue-500' },
  { name: 'Cyan', hue: 190, class: 'bg-cyan-500' },
  { name: 'Teal', hue: 168, class: 'bg-teal-500' },
  { name: 'Green', hue: 142, class: 'bg-emerald-500' },
  { name: 'Orange', hue: 25, class: 'bg-orange-500' },
  { name: 'Red', hue: 0, class: 'bg-red-500' },
  { name: 'Pink', hue: 330, class: 'bg-pink-500' },
] as const;

const STORAGE_KEY = 'setflow-appearance';

interface AppearanceSettings {
  accentHue: number;
}

function loadAppearance(): AppearanceSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return { accentHue: 263 }; // Default purple
}

function saveAppearance(settings: AppearanceSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function applyAccentColor(hue: number) {
  const root = document.documentElement;
  // Primary color
  root.style.setProperty('--primary', `${hue} 70% 58%`);
  root.style.setProperty('--ring', `${hue} 70% 58%`);
  // Accent color (slightly different shade)
  root.style.setProperty('--accent', `${(hue + 15) % 360} 90% 65%`);
  // Sidebar colors
  root.style.setProperty('--sidebar-primary', `${hue} 70% 58%`);
  root.style.setProperty('--sidebar-ring', `${hue} 70% 58%`);
}

export function useAppearance() {
  const [settings, setSettings] = useState<AppearanceSettings>(loadAppearance);

  useEffect(() => {
    applyAccentColor(settings.accentHue);
  }, [settings.accentHue]);

  const updateAccentColor = useCallback((hue: number) => {
    const newSettings = { ...settings, accentHue: hue };
    setSettings(newSettings);
    saveAppearance(newSettings);
  }, [settings]);

  return { settings, updateAccentColor };
}

interface AppearanceSettingsProps {
  settings: AppearanceSettings;
  onUpdateAccent: (hue: number) => void;
}

export function AppearanceSettingsSheet({ settings, onUpdateAccent }: AppearanceSettingsProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>Appearance</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Accent Color */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Accent Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => onUpdateAccent(color.hue)}
                  className={cn(
                    'relative h-10 w-full rounded-lg transition-all hover:scale-105',
                    color.class,
                    settings.accentHue === color.hue && 'ring-2 ring-offset-2 ring-offset-background ring-white'
                  )}
                  title={color.name}
                >
                  {settings.accentHue === color.hue && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Choose your preferred accent color for the app.
            </p>
          </div>

          {/* App Info */}
          <div className="pt-4 border-t border-border">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">SetFlow</p>
              <p>Setlist Planner for Musicians</p>
              <p className="text-xs">v1.0.0</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
