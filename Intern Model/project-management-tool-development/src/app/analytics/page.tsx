"use client";
import { useEffect, useState } from "react";
import { TrendingUp, CheckCircle, AlertCircle, Clock } from "lucide-react";
import Topbar from "@/components/Topbar";
import ProgressBar from "@/components/ProgressBar";
import Badge from "@/components/Badge";
import { progressPercent } from "@/lib/utils";

interface Stats {
  projects: number;
  tasks: number;
  done: number;
  users: number;
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
}

interface ProjectSummary {
  id: number;
  name: string;
  status: string;
  color: string;
  deadline: string | null;
  taskCount: number;
  taskDone: number;
}

const STATUS_COLORS: Record<string, string> = {
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  done: "#22c55e",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#3b82f6",
  low: "#94a3b8",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
  }, []);

  const completionRate = stats ? progressPercent(stats.tasks, stats.done) : 0;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const overdueProjects = projects.filter((p) => {
    if (!p.deadline) return false;
    return new Date(p.deadline) < new Date() && p.status !== "completed";
  }).length;

  const summaryCards = [
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: "text-indigo-600 bg-indigo-50",
      detail: `${stats?.done ?? 0} of ${stats?.tasks ?? 0} tasks done`,
    },
    {
      label: "Active Projects",
      value: activeProjects,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-50",
      detail: `${stats?.projects ?? 0} total projects`,
    },
    {
      label: "Overdue Projects",
      value: overdueProjects,
      icon: AlertCircle,
      color: "text-red-500 bg-red-50",
      detail: overdueProjects > 0 ? "Needs attention" : "All on track",
    },
    {
      label: "Team Members",
      value: stats?.users ?? "—",
      icon: Clock,
      color: "text-purple-600 bg-purple-50",
      detail: "Active contributors",
    },
  ];

  return (
    <div>
      <Topbar title="Analytics" subtitle="Project and task performance overview" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {summaryCards.map(({ label, value, icon: Icon, color, detail }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
            <p className="text-xs text-slate-400 mt-1">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tasks by Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-5">Tasks by Status</h3>
          {stats ? (
            <div className="space-y-4">
              {["todo", "in_progress", "review", "done"].map((s) => {
                const found = stats.tasksByStatus.find((x) => x.status === s);
                const count = found?.count ?? 0;
                const pct = stats.tasks > 0 ? Math.round((count / stats.tasks) * 100) : 0;
                return (
                  <div key={s} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-28 flex-shrink-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[s] }}
                      />
                      <span className="text-sm text-slate-600">{STATUS_LABELS[s]}</span>
                    </div>
                    <div className="flex-1">
                      <ProgressBar percent={pct} color={STATUS_COLORS[s]} height={8} />
                    </div>
                    <div className="flex items-center gap-2 w-16 text-right flex-shrink-0">
                      <span className="text-sm font-semibold text-slate-700">{count}</span>
                      <span className="text-xs text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 bg-slate-100 rounded-xl" />)}
            </div>
          )}
        </div>

        {/* Tasks by Priority */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-5">Tasks by Priority</h3>
          {stats ? (
            <div className="space-y-4">
              {["critical", "high", "medium", "low"].map((p) => {
                const found = stats.tasksByPriority.find((x) => x.priority === p);
                const count = found?.count ?? 0;
                const pct = stats.tasks > 0 ? Math.round((count / stats.tasks) * 100) : 0;
                return (
                  <div key={p} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-28 flex-shrink-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PRIORITY_COLORS[p] }}
                      />
                      <span className="text-sm text-slate-600">{PRIORITY_LABELS[p]}</span>
                    </div>
                    <div className="flex-1">
                      <ProgressBar percent={pct} color={PRIORITY_COLORS[p]} height={8} />
                    </div>
                    <div className="flex items-center gap-2 w-16 text-right flex-shrink-0">
                      <span className="text-sm font-semibold text-slate-700">{count}</span>
                      <span className="text-xs text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 bg-slate-100 rounded-xl" />)}
            </div>
          )}
        </div>
      </div>

      {/* Project Progress Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Project Progress Breakdown</h3>
        </div>
        {projects.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No projects yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.map((p) => {
              const pct = progressPercent(p.taskCount, p.taskDone);
              const overdue =
                p.deadline && new Date(p.deadline) < new Date() && p.status !== "completed";
              return (
                <div key={p.id} className="flex items-center gap-5 px-6 py-4">
                  <div
                    className="w-3 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-medium text-slate-800 truncate">{p.name}</span>
                      <Badge variant={p.status as Parameters<typeof Badge>[0]["variant"]} />
                      {overdue && (
                        <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <AlertCircle size={12} /> Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <ProgressBar percent={pct} color={p.color} height={6} />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {p.taskDone}/{p.taskCount} tasks
                      </span>
                      <span className="text-sm font-bold text-slate-700 flex-shrink-0 w-10 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
