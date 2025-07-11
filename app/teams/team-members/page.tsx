"use client";
import { useEffect, useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

export default function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Member" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'Member' });

  useEffect(() => {
    fetch("/api/teams/team-members")
      .then((res) => res.json())
      .then((data) => setMembers(data))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/teams/team-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newMember = await res.json();
      setMembers([...members, newMember]);
      setShowForm(false);
      setForm({ name: "", email: "", role: "Member" });
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setEditForm({ name: member.name, email: member.email, role: member.role });
  };

  const handleEditSave = async (id: string) => {
    const res = await fetch(`/api/teams/team-members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setMembers(members.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    const res = await fetch(`/api/teams/team-members/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMembers(members.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Team Members</h1>
      <div className="mb-6 flex justify-between items-center">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Add Team Member"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white shadow rounded-lg p-6 mb-6 space-y-4">
          <div>
            <label className="block font-medium mb-1">Name</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border px-3 py-2 rounded"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Role</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
              <option value="Guest">Guest</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Add
          </button>
        </form>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : members.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
          No team members yet.
        </div>
      ) : (
        <table className="min-w-full bg-white shadow rounded-lg">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Joined</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t">
                {editingId === member.id ? (
                  <td className="px-4 py-2" colSpan={5}>
                    <div className="flex flex-wrap items-center space-x-2">
                      <input
                        className="border px-2 py-1 rounded"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      />
                      <input
                        className="border px-2 py-1 rounded"
                        value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      />
                      <select
                        className="border px-2 py-1 rounded"
                        value={editForm.role}
                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Member">Member</option>
                        <option value="Guest">Guest</option>
                      </select>
                      <button className="text-green-600" onClick={() => handleEditSave(member.id)} type="button">Save</button>
                      <button className="text-gray-500" onClick={() => setEditingId(null)} type="button">Cancel</button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-2">{member.name}</td>
                    <td className="px-4 py-2">{member.email}</td>
                    <td className="px-4 py-2">{member.role}</td>
                    <td className="px-4 py-2">{new Date(member.joinedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <button
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 mr-2"
                        onClick={() => handleEdit(member)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                        onClick={() => handleDelete(member.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 