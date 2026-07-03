"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Users, Mail, Trash2 } from "lucide-react";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import type { User } from "@/db/schema";

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const u = await fetch("/api/users").then((r) => r.json());
    setUsers(u);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError("Name and email required."); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json();
      setError(err.error);
      return;
    }
    setName("");
    setEmail("");
    setShowCreate(false);
    await load();
  };

  const roleLabels = ["Developer", "Designer", "PM", "QA", "DevOps", "Analyst", "Marketing"];
  const getRoleLabel = (userId: number) => roleLabels[userId % roleLabels.length];

  return (
    <div>
      <Topbar
        title="Team"
        subtitle={`${users.length} member${users.length !== 1 ? "s" : ""}`}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition"
          >
            <Plus size={16} /> Add Member
          </button>
        }
      />

      {users.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">No team members yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first team member to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
          >
            Add Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <Avatar name={u.name} color={u.avatarColor} size="lg" />
                <div>
                  <p className="font-semibold text-slate-800">{u.name}</p>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">{getRoleLabel(u.id)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <Mail size={12} />
                  <span className="truncate max-w-[140px]">{u.email}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Joined {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Add Team Member" onClose={() => { setShowCreate(false); setError(""); }}>
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jane@company.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setError(""); }}
                className="flex-1 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-medium transition disabled:opacity-60"
              >
                {loading ? "Adding…" : "Add Member"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
