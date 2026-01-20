import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SetlistSettingsProps {
  targetMinutes: number;
  changeoverMinutes: number;
  onUpdate: (values: { targetMinutes: number; changeoverMinutes: number }) => void;
}

export function SetlistSettings({
  targetMinutes,
  changeoverMinutes,
  onUpdate,
}: SetlistSettingsProps) {
  const calculatedMusicTime = Math.max(0, targetMinutes - changeoverMinutes);

  const handleSlotTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    onUpdate({ targetMinutes: value, changeoverMinutes });
  };

  const handleChangeoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    onUpdate({ targetMinutes, changeoverMinutes: value });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
      {/* Total Slot Time */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slot-time" className="text-xs text-muted-foreground">
          Total slot time
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="slot-time"
            type="number"
            min={0}
            value={targetMinutes}
            onChange={handleSlotTimeChange}
            className="h-9 w-20 font-mono text-center focus-visible:ring-purple-500"
          />
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      </div>

      {/* Changeover Buffer */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="changeover" className="text-xs text-muted-foreground">
          Changeover buffer
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="changeover"
            type="number"
            min={0}
            value={changeoverMinutes}
            onChange={handleChangeoverChange}
            className="h-9 w-20 font-mono text-center focus-visible:ring-purple-500"
          />
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      </div>

      {/* Calculated Music Time */}
      <div className="flex flex-col gap-1.5 md:ml-2">
        <span className="text-xs text-muted-foreground">Target music time</span>
        <div className="flex h-9 items-center">
          <span className="font-mono text-lg font-semibold text-purple-500">
            {calculatedMusicTime}
          </span>
          <span className="ml-1 text-sm text-muted-foreground">min</span>
        </div>
      </div>
    </div>
  );
}
