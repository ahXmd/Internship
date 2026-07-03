"use client";

interface ProgressBarProps {
  percent: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({
  percent,
  color = "#6366f1",
  height = 6,
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full">
      <div
        className="w-full rounded-full bg-slate-100 overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-500 mt-1 text-right">{clamped}% complete</p>
      )}
    </div>
  );
}
