import { Clipboard, Check, FileDown, Upload, X, Type } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Song, Setlist, formatDuration, formatFullKey } from "@/lib/types";

interface ExportViewProps {
  setlist: Setlist;
  songs: Song[];
}

interface ExportSettings {
  headerLogo: string | null; // base64 data URL for horizontal header logo
  footerLogo: string | null; // base64 data URL for square footer logo
  bandName: string;
  subtitle: string;
  useTextHeader: boolean;
}

const STORAGE_KEY = "setflow-export-settings";

function loadSettings(): ExportSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return {
    headerLogo: null,
    footerLogo: null,
    bandName: "",
    subtitle: "",
    useTextHeader: true,
  };
}

function saveSettings(settings: ExportSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function ExportView({ setlist, songs }: ExportViewProps) {
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>(loadSettings);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  // Get songs in setlist order
  const orderedSongs = setlist.songIds
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is Song => s !== undefined);

  // Calculate totals
  const totalSeconds = orderedSongs.reduce((sum, song) => sum + song.durationSeconds, 0);

  const updateSettings = useCallback((updates: Partial<ExportSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const handleImageUpload = useCallback(
    (type: "header" | "footer") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === "header") {
          updateSettings({ headerLogo: result });
        } else {
          updateSettings({ footerLogo: result });
        }
      };
      reader.readAsDataURL(file);
    },
    [updateSettings]
  );

  const clearLogo = useCallback(
    (type: "header" | "footer") => {
      if (type === "header") {
        updateSettings({ headerLogo: null });
        if (headerInputRef.current) headerInputRef.current.value = "";
      } else {
        updateSettings({ footerLogo: null });
        if (footerInputRef.current) footerInputRef.current.value = "";
      }
    },
    [updateSettings]
  );

  // Generate text version for clipboard
  const generateTextVersion = (): string => {
    const lines: string[] = [];

    if (settings.bandName) {
      lines.push(settings.bandName.toUpperCase());
    }
    if (settings.subtitle) {
      lines.push(settings.subtitle);
    }
    lines.push("");
    lines.push(setlist.name);
    lines.push("=".repeat(40));
    lines.push("");

    orderedSongs.forEach((song) => {
      const shortName = song.shortName || "";
      const key = formatFullKey(song.musicalKey, song.keyMode);
      if (shortName) {
        lines.push(`${shortName} - ${song.title} - ${key}`);
      } else {
        lines.push(`${song.title} - ${key}`);
      }
    });

    lines.push("");
    lines.push("=".repeat(40));
    lines.push(`Total: ${formatDuration(totalSeconds)}`);

    return lines.join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateTextVersion());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleExportPDF = async () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Header logo or text
    if (!settings.useTextHeader && settings.headerLogo) {
      try {
        const img = new Image();
        img.src = settings.headerLogo;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Calculate dimensions to fit header (max width 120mm, max height 30mm)
        const maxWidth = 120;
        const maxHeight = 30;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const imgWidth = img.width * ratio;
        const imgHeight = img.height * ratio;

        pdf.addImage(
          settings.headerLogo,
          "PNG",
          (pageWidth - imgWidth) / 2,
          yPos,
          imgWidth,
          imgHeight
        );
        yPos += imgHeight + 10;
      } catch {
        // Fallback to text if image fails
        pdf.setFontSize(24);
        pdf.setFont("helvetica", "bold");
        pdf.text(settings.bandName || setlist.name, pageWidth / 2, yPos + 10, { align: "center" });
        yPos += 20;
      }
    } else if (settings.bandName) {
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(settings.bandName.toUpperCase(), pageWidth / 2, yPos + 10, { align: "center" });
      yPos += 15;
    }

    // Subtitle
    if (settings.subtitle) {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(settings.subtitle, pageWidth / 2, yPos + 5, { align: "center" });
      yPos += 12;
    }

    // Setlist name
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(setlist.name, pageWidth / 2, yPos + 8, { align: "center" });
    yPos += 15;

    // Divider line
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Songs - centered format: short name - song name - key
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");

    orderedSongs.forEach((song) => {
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = margin;
      }

      const shortName = song.shortName || "";
      const key = formatFullKey(song.musicalKey, song.keyMode);

      let songLine: string;
      if (shortName) {
        songLine = `${shortName}  —  ${song.title}  —  ${key}`;
      } else {
        songLine = `${song.title}  —  ${key}`;
      }

      pdf.text(songLine, pageWidth / 2, yPos, { align: "center" });
      yPos += 8;
    });

    // Bottom divider
    yPos += 5;
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Total runtime - centered
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total: ${formatDuration(totalSeconds)}`, pageWidth / 2, yPos, { align: "center" });

    // Footer logo (bottom right, square 1:1)
    if (settings.footerLogo) {
      try {
        const logoSize = 20; // 20mm square
        pdf.addImage(
          settings.footerLogo,
          "PNG",
          pageWidth - margin - logoSize,
          pageHeight - margin - logoSize,
          logoSize,
          logoSize
        );
      } catch {
        // ignore logo errors
      }
    }

    // Save PDF
    const filename = `${setlist.name.replace(/[^a-zA-Z0-9]/g, "_")}_setlist.pdf`;
    pdf.save(filename);
  };

  return (
    <div className="space-y-6">
      {/* Export Settings */}
      <div className="space-y-4 p-4 rounded-lg bg-secondary/50 border border-border">
        <h3 className="text-sm font-medium text-foreground">PDF Settings</h3>

        {/* Header option toggle */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => updateSettings({ useTextHeader: true })}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
              settings.useTextHeader
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            <Type className="w-4 h-4" />
            Text Header
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ useTextHeader: false })}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
              !settings.useTextHeader
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            <Upload className="w-4 h-4" />
            Logo Header
          </button>
        </div>

        {/* Text header options */}
        {settings.useTextHeader && (
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bandName" className="text-xs text-muted-foreground">
                Band Name
              </Label>
              <Input
                id="bandName"
                value={settings.bandName}
                onChange={(e) => updateSettings({ bandName: e.target.value })}
                placeholder="Your Band Name"
                className="h-9 bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subtitle" className="text-xs text-muted-foreground">
                Subtitle (venue, date, etc.)
              </Label>
              <Input
                id="subtitle"
                value={settings.subtitle}
                onChange={(e) => updateSettings({ subtitle: e.target.value })}
                placeholder="Summer Tour 2025"
                className="h-9 bg-background"
              />
            </div>
          </div>
        )}

        {/* Logo header upload */}
        {!settings.useTextHeader && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Header Logo (horizontal, e.g. band name logo)
            </Label>
            <div className="flex items-center gap-2">
              <input
                ref={headerInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload("header")}
                className="hidden"
              />
              {settings.headerLogo ? (
                <div className="flex items-center gap-2 flex-1">
                  <div className="h-12 px-3 bg-background rounded border border-border flex items-center">
                    <img
                      src={settings.headerLogo}
                      alt="Header logo"
                      className="h-8 max-w-[120px] object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => clearLogo("header")}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => headerInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Header Logo
                </Button>
              )}
            </div>
            {/* Still show subtitle for logo mode */}
            <div className="space-y-1.5 mt-3">
              <Label htmlFor="subtitle2" className="text-xs text-muted-foreground">
                Subtitle (optional)
              </Label>
              <Input
                id="subtitle2"
                value={settings.subtitle}
                onChange={(e) => updateSettings({ subtitle: e.target.value })}
                placeholder="Summer Tour 2025"
                className="h-9 bg-background"
              />
            </div>
          </div>
        )}

        {/* Footer logo */}
        <div className="space-y-2 pt-2 border-t border-border">
          <Label className="text-xs text-muted-foreground">
            Footer Logo (square 1:1, bottom right corner)
          </Label>
          <div className="flex items-center gap-2">
            <input
              ref={footerInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload("footer")}
              className="hidden"
            />
            {settings.footerLogo ? (
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 bg-background rounded border border-border flex items-center justify-center p-1">
                  <img
                    src={settings.footerLogo}
                    alt="Footer logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => clearLogo("footer")}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => footerInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Footer Logo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-6 rounded-lg bg-white text-black border border-border">
        <div className="text-center space-y-2 mb-6">
          {settings.useTextHeader && settings.bandName && (
            <h2 className="text-xl font-bold uppercase tracking-wide">
              {settings.bandName}
            </h2>
          )}
          {!settings.useTextHeader && settings.headerLogo && (
            <div className="flex justify-center mb-2">
              <img
                src={settings.headerLogo}
                alt="Header"
                className="h-12 object-contain"
              />
            </div>
          )}
          {settings.subtitle && (
            <p className="text-sm text-gray-600">{settings.subtitle}</p>
          )}
          <h3 className="text-lg font-semibold">{setlist.name}</h3>
          <div className="w-full h-px bg-gray-300 mt-2" />
        </div>

        <div className="space-y-1.5 text-center">
          {orderedSongs.map((song) => {
            const shortName = song.shortName || "";
            const key = formatFullKey(song.musicalKey, song.keyMode);
            return (
              <p key={song.id} className="text-sm">
                {shortName ? (
                  <>
                    <span className="font-medium">{shortName}</span>
                    <span className="text-gray-400 mx-2">—</span>
                    {song.title}
                    <span className="text-gray-400 mx-2">—</span>
                    <span className="text-gray-600">{key}</span>
                  </>
                ) : (
                  <>
                    {song.title}
                    <span className="text-gray-400 mx-2">—</span>
                    <span className="text-gray-600">{key}</span>
                  </>
                )}
              </p>
            );
          })}
        </div>

        <div className="mt-4 pt-2 border-t border-gray-300 text-center">
          <p className="text-xs font-medium text-gray-600">
            Total: {formatDuration(totalSeconds)}
          </p>
        </div>

        {settings.footerLogo && (
          <div className="flex justify-end mt-4">
            <img
              src={settings.footerLogo}
              alt="Footer"
              className="w-10 h-10 object-contain"
            />
          </div>
        )}
      </div>

      {/* Export buttons */}
      <div className="flex gap-2">
        <Button onClick={handleExportPDF} className="flex-1 gap-2">
          <FileDown className="w-4 h-4" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={handleCopy} className="gap-2">
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Clipboard className="h-4 w-4" />
              Copy Text
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
