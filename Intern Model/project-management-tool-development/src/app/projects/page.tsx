"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Trash2, Pencil, Clock } from "lucide-react";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";
import ProjectForm from "@/components/ProjectForm";
import Badge from "@/components/Badge";
import ProgressBar from "@/components/ProgressBar";
import type { User, Project } from "@/db/schema";
import { formatDate, progressPercent, daysUntil } from "@/lib/utils";

interface ProjectWithCounts extends Project {
  taskCount: number;
  taskDone: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<ProjectWithCounts | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [p, u] = await Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]);
    setProjects(p);
    setUsers(u);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: Partial<Project>) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    setShowCreate(false);
    await load();
  };

  const handleEdit = async (data: Partial<Project>) => {
    if (!editProject) return;
    const res = await fetch(`/api/projects/${editProject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update.");
    setEditProject(null);
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    await load();
  };

  const filterStatus = (status: string) =>
    projects.filter((p) => (status === "all" ? true : p.status === status));

  const [filter, setFilter] = useState("all");
  const displayed = filter === "all" ? projects : filterStatus(filter);

  return (
    <div>
      <Topbar
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""} total`}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition"
          >
            <Plus size={16} /> New Project
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "planning", "active", "on_hold", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
              filter === s
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
            }`}
          >
            {s === "all" ? "All" : s === "on_hold" ? "On Hold" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse h-48" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">No projects found</p>
          <p className="text-slate-400 text-sm mt-1">Create your first project to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((p) => {
            const pct = progressPercent(p.taskCount, p.taskDone);
            const days = daysUntil(p.deadline);
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative overflow-hidden"
              >
                {/* Color bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: p.color }}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${p.color}20` }}
                      >
                        <FolderKanban size={18} style={{ color: p.color }} />
                      </div>
                      <div>
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-semibold text-slate-800 hover:text-indigo-600 transition line-clamp-1"
                        >
                          {p.name}
                        </Link>
                        <Badge variant={p.status as Parameters<typeof Badge>[0]["variant"]} className="mt-0.5" />
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => setEditProject(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{p.description}</p>
                  )}

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Progress</span>
                      <span>{p.taskDone}/{p.taskCount} tasks</span>
                    </div>
                    <ProgressBar percent={pct} color={p.color} height={6} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    {p.deadline ? (
                      <div
                        className={`flex items-center gap-1 ${
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
                    ) : (
                      <span>No deadline</span>
                    )}
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-indigo-500 font-medium hover:text-indigo-700 transition"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <Modal title="Create New Project" onClose={() => setShowCreate(false)}>
          <ProjectForm
            users={users}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {editProject && (
        <Modal title="Edit Project" onClose={() => setEditProject(null)}>
          <ProjectForm
            users={users}
            initial={editProject}
            onSubmit={handleEdit}
            onCancel={() => setEditProject(null)}
            submitLabel="Save Changes"
          />
        </Modal>
      )}
    </div>
  );
}
