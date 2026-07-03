"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import Topbar from "@/components/Topbar";
import ProgressBar from "@/components/ProgressBar";
import Badge from "@/components/Badge";
import { formatDate, progressPercent, daysUntil } from "@/lib/utils";

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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
  }, []);

  const completionRate = stats
    ? progressPercent(stats.tasks, stats.done)
    : 0;

  const statCards = [
    {
      label: "Total Projects",
      value: stats?.projects ?? "—",
      icon: FolderKanban,
      color: "bg-indigo-50 text-indigo-600",
      bg: "bg-indigo-500",
    },
    {
      label: "Total Tasks",
      value: stats?.tasks ?? "—",
      icon: CheckSquare,
      color: "bg-blue-50 text-blue-600",
      bg: "bg-blue-500",
    },
    {
      label: "Completed Tasks",
      value: stats?.done ?? "—",
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600",
      bg: "bg-emerald-500",
    },
    {
      label: "Team Members",
      value: stats?.users ?? "—",
      icon: Users,
      color: "bg-purple-50 text-purple-600",
      bg: "bg-purple-500",
    },
  ];

  const statusOrder = ["todo", "in_progress", "review", "done"];
  const statusColors: Record<string, string> = {
    todo: "#94a3b8",
    in_progress: "#3b82f6",
    review: "#f59e0b",
    done: "#22c55e",
  };

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle={`${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
        actions={
          <Link
            href="/projects"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition"
          >
            View Projects <ArrowRight size={15} />
          </Link>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overall Completion */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-1">Overall Progress</h3>
          <p className="text-slate-500 text-sm mb-4">Task completion across all projects</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-slate-800">{completionRate}%</span>
            <span className="text-slate-500 text-sm mb-1">complete</span>
          </div>
          <ProgressBar percent={completionRate} color="#6366f1" height={10} />
          <p className="text-xs text-slate-400 mt-2">
            {stats?.done ?? 0} of {stats?.tasks ?? 0} tasks completed
          </p>
        </div>

        {/* Tasks by Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Tasks by Status</h3>
          {stats ? (
            <div className="space-y-3">
              {statusOrder.map((s) => {
                const found = stats.tasksByStatus.find((x) => x.status === s);
                const count = found?.count ?? 0;
                const pct = stats.tasks > 0 ? Math.round((count / stats.tasks) * 100) : 0;
                const labels: Record<string, string> = {
                  todo: "To Do", in_progress: "In Progress", review: "In Review", done: "Done"
                };
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>{labels[s]}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <ProgressBar percent={pct} color={statusColors[s]} height={6} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="animate-pulse space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-4 bg-slate-100 rounded" />)}
            </div>
          )}
        </div>

        {/* Tasks by Priority */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Tasks by Priority</h3>
          {stats ? (
            <div className="space-y-3">
              {["critical", "high", "medium", "low"].map((p) => {
                const found = stats.tasksByPriority.find((x) => x.priority === p);
                const count = found?.count ?? 0;
                const pct = stats.tasks > 0 ? Math.round((count / stats.tasks) * 100) : 0;
                const colors: Record<string, string> = {
                  critical: "#ef4444", high: "#f97316", medium: "#3b82f6", low: "#94a3b8"
                };
                const labels: Record<string, string> = {
                  critical: "Critical", high: "High", medium: "Medium", low: "Low"
                };
                return (
                  <div key={p}>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>{labels[p]}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <ProgressBar percent={pct} color={colors[p]} height={6} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="animate-pulse space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-4 bg-slate-100 rounded" />)}
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Recent Projects</h3>
          <Link href="/projects" className="text-indigo-600 text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FolderKanban size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No projects yet. Create your first project!</p>
            <Link
              href="/projects"
              className="mt-3 inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition"
            >
              Create Project
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.slice(0, 5).map((p) => {
              const pct = progressPercent(p.taskCount, p.taskDone);
              const days = daysUntil(p.deadline);
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition group"
                >
                  <div
                    className="w-3 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-800 truncate group-hover:text-indigo-600 transition">
                        {p.name}
                      </p>
                      <Badge variant={p.status as Parameters<typeof Badge>[0]["variant"]} />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <ProgressBar percent={pct} color={p.color} height={4} />
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {p.taskDone}/{p.taskCount} tasks
                      </span>
                    </div>
                  </div>
                  {p.deadline && (
                    <div
                      className={`flex items-center gap-1 text-xs flex-shrink-0 ${
                        days !== null && days < 0
                          ? "text-red-500"
                          : days !== null && days <= 7
                          ? "text-orange-500"
                          : "text-slate-400"
                      }`}
                    >
                      <Clock size={12} />
                      {days !== null
                        ? days < 0
                          ? `${Math.abs(days)}d overdue`
                          : days === 0
                          ? "Due today"
                          : `${days}d left`
                        : formatDate(p.deadline)}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
