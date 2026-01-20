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
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Header logo or text
    if (!settings.useTextHeader && settings.headerLogo) {
      try {
        const img = new Image();
        img.src = settings.headerLogo;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const maxWidth = 140;
        const maxHeight = 25;
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
        yPos += imgHeight + 6;
      } catch {
        pdf.setFontSize(28);
        pdf.setFont("helvetica", "bold");
        pdf.text(settings.bandName || setlist.name, pageWidth / 2, yPos + 8, { align: "center" });
        yPos += 14;
      }
    } else if (settings.bandName) {
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text(settings.bandName.toUpperCase(), pageWidth / 2, yPos + 8, { align: "center" });
      yPos += 14;
    }

    // Subtitle (venue, date, etc.)
    if (settings.subtitle) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.text(settings.subtitle, pageWidth / 2, yPos + 4, { align: "center" });
      yPos += 10;
    }

    // Setlist name with thick divider
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(setlist.name, pageWidth / 2, yPos + 6, { align: "center" });
    yPos += 12;

    // Thick header divider
    pdf.setLineWidth(1.5);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Calculate row height based on number of songs to maximize use of page
    const footerSpace = 25; // Space for total time at bottom
    const availableHeight = pageHeight - yPos - footerSpace;
    const songCount = orderedSongs.length;
    const maxRowHeight = 18; // Maximum comfortable row height
    const minRowHeight = 12; // Minimum readable row height
    const rowHeight = Math.max(minRowHeight, Math.min(maxRowHeight, availableHeight / songCount));

    // Determine font sizes based on row height
    const numberFontSize = Math.min(24, rowHeight * 1.2);
    const shortNameFontSize = Math.min(22, rowHeight * 1.1);
    const titleFontSize = Math.min(16, rowHeight * 0.85);
    const metaFontSize = Math.min(12, rowHeight * 0.65);

    // Column positions for stage-readable layout
    const numCol = margin; // Song number
    const shortNameCol = margin + 12; // Short name (cue name)
    const titleCol = margin + 55; // Full title
    const keyCol = pageWidth - margin - 35; // Key
    const bpmCol = pageWidth - margin - 12; // BPM

    // Songs - large, bold, left-aligned for stage reading
    orderedSongs.forEach((song, index) => {
      // Check if we need a new page
      if (yPos > pageHeight - footerSpace - rowHeight) {
        pdf.addPage();
        yPos = margin;

        // Add continuation header
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "italic");
        pdf.text(`${setlist.name} (continued)`, pageWidth / 2, yPos + 4, { align: "center" });
        yPos += 10;
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;
      }

      const songNum = (index + 1).toString();
      const shortName = song.shortName || "";
      const key = song.musicalKey + (song.keyMode === "Minor" ? "m" : "");
      const bpm = song.bpm.toString();

      // Alternating row background for readability
      if (index % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin - 2, yPos - 2, contentWidth + 4, rowHeight, "F");
      }

      // Song number - bold, darker grey for visibility
      pdf.setFontSize(numberFontSize);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(70, 70, 70);
      pdf.text(songNum, numCol, yPos + rowHeight * 0.65);

      // Short name (cue) - largest, boldest for quick stage reference
      pdf.setFontSize(shortNameFontSize);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      if (shortName) {
        pdf.text(shortName.toUpperCase(), shortNameCol, yPos + rowHeight * 0.65);
      }

      // Full title - bold and darker for low-light readability
      pdf.setFontSize(titleFontSize);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(40, 40, 40);
      const maxTitleWidth = keyCol - titleCol - 5;
      const titleText = pdf.splitTextToSize(song.title, maxTitleWidth)[0]; // Truncate if needed
      pdf.text(titleText, titleCol, yPos + rowHeight * 0.65);

      // Key - prominent for musicians
      pdf.setFontSize(metaFontSize + 2);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(key, keyCol, yPos + rowHeight * 0.65);

      // BPM - bold and darker for visibility
      pdf.setFontSize(metaFontSize);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(60, 60, 60);
      pdf.text(bpm, bpmCol, yPos + rowHeight * 0.65, { align: "right" });

      yPos += rowHeight;
    });

    // Bottom section
    yPos += 4;

    // Final divider
    pdf.setLineWidth(1.5);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Total runtime and song count - prominent
    // If there's a footer logo, position text to the left to make room
    const logoSize = 16;
    const hasLogo = !!settings.footerLogo;

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    const totalText = `${orderedSongs.length} SONGS  •  ${formatDuration(totalSeconds)} TOTAL`;

    if (hasLogo) {
      // Left-align text when logo present
      pdf.text(totalText, margin, yPos + 4);
    } else {
      // Center text when no logo
      pdf.text(totalText, pageWidth / 2, yPos + 4, { align: "center" });
    }

    // Footer logo (right side, inline with total info)
    if (settings.footerLogo) {
      try {
        pdf.addImage(
          settings.footerLogo,
          "PNG",
          pageWidth - margin - logoSize,
          yPos - 2,
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

      {/* Preview - Stage-readable format */}
      <div className="p-4 rounded-lg bg-white text-black border border-border overflow-hidden">
        {/* Header */}
        <div className="text-center space-y-1 mb-3">
          {settings.useTextHeader && settings.bandName && (
            <h2 className="text-lg font-bold uppercase tracking-wide">
              {settings.bandName}
            </h2>
          )}
          {!settings.useTextHeader && settings.headerLogo && (
            <div className="flex justify-center mb-1">
              <img
                src={settings.headerLogo}
                alt="Header"
                className="h-8 object-contain"
              />
            </div>
          )}
          {settings.subtitle && (
            <p className="text-xs text-gray-600">{settings.subtitle}</p>
          )}
          <h3 className="text-sm font-semibold">{setlist.name}</h3>
        </div>

        {/* Thick divider */}
        <div className="w-full h-0.5 bg-black mb-2" />

        {/* Song list - table format */}
        <div className="space-y-0">
          {orderedSongs.map((song, index) => {
            const shortName = song.shortName || "";
            const key = song.musicalKey + (song.keyMode === "Minor" ? "m" : "");
            return (
              <div
                key={song.id}
                className={cn(
                  "flex items-center gap-2 py-1.5 px-1",
                  index % 2 === 0 && "bg-gray-100"
                )}
              >
                {/* Number */}
                <span className="w-5 text-sm font-bold text-gray-500 shrink-0">
                  {index + 1}
                </span>
                {/* Short name */}
                <span className="w-16 text-sm font-bold uppercase truncate shrink-0">
                  {shortName}
                </span>
                {/* Title */}
                <span className="flex-1 text-xs font-bold text-gray-700 truncate">
                  {song.title}
                </span>
                {/* Key */}
                <span className="w-8 text-xs font-bold text-right shrink-0">
                  {key}
                </span>
                {/* BPM */}
                <span className="w-8 text-xs font-bold text-gray-500 text-right shrink-0">
                  {song.bpm}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="w-full h-0.5 bg-black mt-2 mb-2" />
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold">
            {orderedSongs.length} SONGS • {formatDuration(totalSeconds)} TOTAL
          </p>
          {settings.footerLogo && (
            <img
              src={settings.footerLogo}
              alt="Footer"
              className="w-8 h-8 object-contain"
            />
          )}
        </div>
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
