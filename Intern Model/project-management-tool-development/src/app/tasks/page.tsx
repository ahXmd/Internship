"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Circle,
  Trash2,
  Pencil,
  Clock,
  User,
  Filter,
} from "lucide-react";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";
import TaskForm from "@/components/TaskForm";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";
import type { User as UserType, Task, Project } from "@/db/schema";
import { formatDate } from "@/lib/utils";

interface TaskWithMeta extends Task {
  assigneeName: string | null;
  assigneeColor: string | null;
}

interface ProjectWithTasks extends Project {
  tasks: TaskWithMeta[];
}

export default function TasksPage() {
  const [projectsWithTasks, setProjectsWithTasks] = useState<ProjectWithTasks[]>([]);
  const [flatTasks, setFlatTasks] = useState<(TaskWithMeta & { projectName: string; projectColor: string; projectId: number })[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [editTask, setEditTask] = useState<TaskWithMeta | null>(null);
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [projects, u] = await Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]);
    setUsers(u);

    const withTasks: ProjectWithTasks[] = await Promise.all(
      projects.map(async (p: Project) => {
        const tasks = await fetch(`/api/projects/${p.id}/tasks`).then((r) => r.json());
        return { ...p, tasks };
      })
    );
    setProjectsWithTasks(withTasks);

    const flat = withTasks.flatMap((p) =>
      p.tasks.map((t) => ({
        ...t,
        projectName: p.name,
        projectColor: p.color,
        projectId: p.id,
      }))
    );
    setFlatTasks(flat);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEditTask = async (data: Partial<Task>) => {
    if (!editTask) return;
    await fetch(`/api/tasks/${editTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditTask(null);
    await load();
  };

  const handleToggle = async (task: TaskWithMeta) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed, status: !task.completed ? "done" : "todo" }),
    });
    await load();
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    await load();
  };

  const filtered = flatTasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterAssignee !== "all") {
      if (filterAssignee === "unassigned" && t.assigneeId !== null) return false;
      if (filterAssignee !== "unassigned" && t.assigneeId?.toString() !== filterAssignee) return false;
    }
    return true;
  });

  return (
    <div>
      <Topbar
        title="All Tasks"
        subtitle={`${filtered.length} task${filtered.length !== 1 ? "s" : ""} shown`}
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter size={16} />
          <span className="text-sm font-medium">Filter:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Assignee</label>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All</option>
            <option value="unassigned">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {(filterStatus !== "all" || filterPriority !== "all" || filterAssignee !== "all") && (
          <button
            onClick={() => { setFilterStatus("all"); setFilterPriority("all"); setFilterAssignee("all"); }}
            className="text-xs text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span />
          <span>Task</span>
          <span>Project</span>
          <span>Assignee</span>
          <span>Priority</span>
          <span>Deadline</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 font-medium">No tasks found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-3 px-5 py-3 hover:bg-slate-50 transition"
              >
                <button
                  onClick={() => handleToggle(task)}
                  className="text-slate-300 hover:text-emerald-500 transition"
                >
                  {task.completed ? (
                    <CheckCircle size={18} className="text-emerald-500" />
                  ) : (
                    <Circle size={18} />
                  )}
                </button>

                <div>
                  <p className={`text-sm font-medium ${task.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                    {task.title}
                  </p>
                  <Badge variant={task.status as Parameters<typeof Badge>[0]["variant"]} className="mt-0.5" />
                </div>

                <Link
                  href={`/projects/${task.projectId}`}
                  className="flex items-center gap-2 text-xs hover:text-indigo-600 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.projectColor }}
                  />
                  <span className="text-slate-600 max-w-[100px] truncate">{task.projectName}</span>
                </Link>

                <div>
                  {task.assigneeName ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar name={task.assigneeName} color={task.assigneeColor ?? "#6366f1"} size="sm" />
                      <span className="text-xs text-slate-600 hidden xl:block">{task.assigneeName}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300 flex items-center gap-1">
                      <User size={13} />
                    </span>
                  )}
                </div>

                <Badge variant={task.priority as Parameters<typeof Badge>[0]["variant"]} />

                <span className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
                  <Clock size={11} />
                  {formatDate(task.deadline)}
                </span>

                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditTask(task); setEditProjectId(task.projectId); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          <TaskForm
            users={users}
            initial={editTask}
            onSubmit={handleEditTask}
            onCancel={() => setEditTask(null)}
            submitLabel="Save Changes"
          />
        </Modal>
      )}
    </div>
  );
}
