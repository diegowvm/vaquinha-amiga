import { progressPercent } from "@/lib/format";

interface ProgressBarProps {
  current: number;
  goal: number;
  size?: "sm" | "md";
}

export function ProgressBar({ current, goal, size = "md" }: ProgressBarProps) {
  const pct = progressPercent(current, goal);
  const h = size === "sm" ? "h-2" : "h-3";

  return (
    <div className={`w-full ${h} rounded-full bg-muted overflow-hidden`}>
      <div
        className="progress-bar-fill h-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
