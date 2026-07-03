"use client";

type Variant =
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

const variantStyles: Record<Variant, string> = {
  todo: "bg-slate-100 text-slate-600 border border-slate-200",
  in_progress: "bg-blue-50 text-blue-700 border border-blue-200",
  review: "bg-amber-50 text-amber-700 border border-amber-200",
  done: "bg-green-50 text-green-700 border border-green-200",
  low: "bg-slate-100 text-slate-600 border border-slate-200",
  medium: "bg-blue-50 text-blue-700 border border-blue-200",
  high: "bg-orange-50 text-orange-700 border border-orange-200",
  critical: "bg-red-50 text-red-700 border border-red-200",
  planning: "bg-purple-50 text-purple-700 border border-purple-200",
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  on_hold: "bg-amber-50 text-amber-700 border border-amber-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-slate-100 text-slate-500 border border-slate-200",
};

const variantLabels: Record<Variant, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface BadgeProps {
  variant: Variant;
  className?: string;
}

export default function Badge({ variant, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {variantLabels[variant]}
    </span>
  );
}
