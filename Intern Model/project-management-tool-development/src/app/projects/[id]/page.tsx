"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  CheckCircle,
  Circle,
  MessageSquare,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";
import TaskForm from "@/components/TaskForm";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";
import ProgressBar from "@/components/ProgressBar";
import type { User as UserType, Project, Task } from "@/db/schema";
import { formatDate, progressPercent, daysUntil } from "@/lib/utils";

interface TaskWithAssignee extends Task {
  assigneeName: string | null;
  assigneeColor: string | null;
}

interface CommentWithAuthor {
  id: number;
  taskId: number;
  body: string;
  createdAt: string;
  authorId: number | null;
  authorName: string | null;
  authorColor: string | null;
}

const COLUMNS = ["todo", "in_progress", "review", "done"] as const;
type Col = (typeof COLUMNS)[number];
const COL_LABELS: Record<Col, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
};
const COL_COLORS: Record<Col, string> = {
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  done: "#22c55e",
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithAssignee | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignee | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const load = useCallback(async () => {
    const [proj, t, u] = await Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/projects/${id}/tasks`).then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]);
    if (proj.error) { router.push("/projects"); return; }
    setProject(proj);
    setTasks(t);
    setUsers(u);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const loadComments = useCallback(async (taskId: number) => {
    const c = await fetch(`/api/tasks/${taskId}/comments`).then((r) => r.json());
    setComments(c);
  }, []);

  useEffect(() => {
    if (selectedTask) loadComments(selectedTask.id);
  }, [selectedTask, loadComments]);

  const handleCreateTask = async (data: Partial<Task>) => {
    const res = await fetch(`/api/projects/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    setShowCreateTask(false);
    await load();
  };

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

  const handleToggleComplete = async (task: TaskWithAssignee) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed, status: !task.completed ? "done" : "todo" }),
    });
    await load();
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (selectedTask?.id === taskId) setSelectedTask(null);
    await load();
  };

  const handleMoveTask = async (task: TaskWithAssignee, status: Col) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, completed: status === "done" }),
    });
    await load();
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedTask) return;
    await fetch(`/api/tasks/${selectedTask.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: commentText.trim(),
        authorId: commentAuthor ? Number(commentAuthor) : null,
      }),
    });
    setCommentText("");
    await loadComments(selectedTask.id);
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const pct = progressPercent(total, done);
  const days = daysUntil(project.deadline);

  const tasksByCol = (col: Col) => tasks.filter((t) => t.status === col);

  const priorityDot: Record<string, string> = {
    low: "bg-slate-400",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  };

  return (
    <div>
      <Topbar
        title={project.name}
        subtitle={project.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setView("kanban")}
                className={`px-3 py-1.5 text-sm font-medium transition ${
                  view === "kanban" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 text-sm font-medium transition ${
                  view === "list" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                List
              </button>
            </div>
            <button
              onClick={() => setShowCreateTask(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition"
            >
              <Plus size={16} /> Add Task
            </button>
          </div>
        }
      />

      {/* Project meta */}
      <div className="flex items-center gap-3 mb-6 -mt-4">
        <Link href="/projects" className="text-slate-400 hover:text-slate-700 transition">
          <ArrowLeft size={18} />
        </Link>
        <Badge variant={project.status as Parameters<typeof Badge>[0]["variant"]} />
        {project.deadline && (
          <span
            className={`flex items-center gap-1 text-xs ${
              days !== null && days < 0 ? "text-red-500" : days !== null && days <= 7 ? "text-orange-500" : "text-slate-400"
            }`}
          >
            <Clock size={12} />
            Deadline: {formatDate(project.deadline)}
            {days !== null && ` (${days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "today" : `${days}d left`})`}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-slate-800">{pct}%</span>
            <span className="text-sm text-slate-500">{done}/{total} tasks complete</span>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            {COLUMNS.map((col) => (
              <span key={col} className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: COL_COLORS[col] }}
                />
                {COL_LABELS[col]}: {tasksByCol(col).length}
              </span>
            ))}
          </div>
        </div>
        <ProgressBar percent={pct} color={project.color} height={8} />
      </div>

      {/* Kanban Board */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasksByCol(col);
            return (
              <div key={col} className="bg-slate-100 rounded-2xl p-3 min-h-64">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COL_COLORS[col] }}
                    />
                    <span className="text-sm font-semibold text-slate-700">{COL_LABELS[col]}</span>
                  </div>
                  <span className="text-xs bg-white text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow group"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[task.priority]}`}
                          />
                          <p className={`text-sm font-medium text-slate-800 leading-snug ${task.completed ? "line-through text-slate-400" : ""}`}>
                            {task.title}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
                          className="text-slate-300 hover:text-emerald-500 transition flex-shrink-0"
                        >
                          {task.completed ? <CheckCircle size={16} className="text-emerald-500" /> : <Circle size={16} />}
                        </button>
                      </div>

                      {task.deadline && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                          <Clock size={11} />
                          {formatDate(task.deadline)}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {task.assigneeName ? (
                          <Avatar name={task.assigneeName} color={task.assigneeColor ?? "#6366f1"} size="sm" />
                        ) : (
                          <span className="text-xs text-slate-300">Unassigned</span>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          {COLUMNS.filter((c) => c !== col).map((c) => (
                            <button
                              key={c}
                              onClick={(e) => { e.stopPropagation(); handleMoveTask(task, c); }}
                              className="text-xs text-slate-400 hover:text-indigo-600 px-1"
                              title={`Move to ${COL_LABELS[c]}`}
                            >
                              →{c === "todo" ? "T" : c === "in_progress" ? "P" : c === "review" ? "R" : "D"}
                            </button>
                          ))}
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditTask(task); }}
                            className="text-slate-400 hover:text-slate-700 transition"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                            className="text-slate-400 hover:text-red-500 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowCreateTask(true)}
                  className="mt-2 w-full text-center text-xs text-slate-400 hover:text-indigo-600 py-2 rounded-xl hover:bg-white transition border border-dashed border-slate-200 hover:border-indigo-300"
                >
                  + Add task
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span />
            <span>Task</span>
            <span>Assignee</span>
            <span>Priority</span>
            <span>Deadline</span>
            <span>Actions</span>
          </div>
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400">No tasks yet</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <div key={task.id}>
                  <div
                    className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
                      className="text-slate-300 hover:text-emerald-500 transition"
                    >
                      {task.completed ? <CheckCircle size={18} className="text-emerald-500" /> : <Circle size={18} />}
                    </button>
                    <div>
                      <p className={`text-sm font-medium ${task.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {task.title}
                      </p>
                      <Badge variant={task.status as Parameters<typeof Badge>[0]["variant"]} className="mt-0.5" />
                    </div>
                    <div>
                      {task.assigneeName ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={task.assigneeName} color={task.assigneeColor ?? "#6366f1"} size="sm" />
                          <span className="text-xs text-slate-600">{task.assigneeName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 flex items-center gap-1"><User size={14} />Unassigned</span>
                      )}
                    </div>
                    <Badge variant={task.priority as Parameters<typeof Badge>[0]["variant"]} />
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} />{formatDate(task.deadline)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditTask(task); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                      {expandedTask === task.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>
                  {expandedTask === task.id && (
                    <div className="px-12 py-3 bg-slate-50 border-t border-slate-100">
                      {task.description && <p className="text-sm text-slate-600 mb-2">{task.description}</p>}
                      <div className="flex gap-2">
                        {COLUMNS.map((c) => (
                          <button
                            key={c}
                            onClick={() => handleMoveTask(task, c)}
                            disabled={task.status === c}
                            className={`text-xs px-3 py-1 rounded-full border transition ${
                              task.status === c
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                            }`}
                          >
                            {COL_LABELS[c]}
                          </button>
                        ))}
                        <button
                          onClick={() => { setSelectedTask(task); }}
                          className="text-xs px-3 py-1 rounded-full border bg-white text-slate-600 border-slate-200 hover:border-indigo-300 flex items-center gap-1"
                        >
                          <MessageSquare size={11} /> Comments
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Detail / Comments Modal */}
      {selectedTask && (
        <Modal
          title={selectedTask.title}
          onClose={() => setSelectedTask(null)}
          size="lg"
        >
          <div className="p-6 space-y-5">
            <div className="flex gap-3 flex-wrap">
              <Badge variant={selectedTask.status as Parameters<typeof Badge>[0]["variant"]} />
              <Badge variant={selectedTask.priority as Parameters<typeof Badge>[0]["variant"]} />
              {selectedTask.assigneeName && (
                <div className="flex items-center gap-2">
                  <Avatar name={selectedTask.assigneeName} color={selectedTask.assigneeColor ?? "#6366f1"} size="sm" />
                  <span className="text-sm text-slate-600">{selectedTask.assigneeName}</span>
                </div>
              )}
              {selectedTask.deadline && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={12} /> Due: {formatDate(selectedTask.deadline)}
                </span>
              )}
            </div>
            {selectedTask.description && (
              <p className="text-sm text-slate-600 leading-relaxed">{selectedTask.description}</p>
            )}

            {/* Status change */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Move to</p>
              <div className="flex gap-2 flex-wrap">
                {COLUMNS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { handleMoveTask(selectedTask, c); setSelectedTask({ ...selectedTask, status: c, completed: c === "done" }); }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      selectedTask.status === c
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {COL_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">
                Comments ({comments.length})
              </p>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      {c.authorName ? (
                        <Avatar name={c.authorName} color={c.authorColor ?? "#94a3b8"} size="sm" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                        <p className="text-xs font-medium text-slate-700 mb-0.5">
                          {c.authorName ?? "Anonymous"}
                          <span className="font-normal text-slate-400 ml-2">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </p>
                        <p className="text-sm text-slate-700">{c.body}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <select
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Comment as Anonymous</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    placeholder="Write a comment..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showCreateTask && (
        <Modal title="Add New Task" onClose={() => setShowCreateTask(false)}>
          <TaskForm users={users} onSubmit={handleCreateTask} onCancel={() => setShowCreateTask(false)} />
        </Modal>
      )}

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
