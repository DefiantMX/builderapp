"use client";
import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", createdBy: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', createdBy: '' });

  useEffect(() => {
    fetch("/api/teams/announcements")
      .then((res) => res.json())
      .then((data) => setAnnouncements(data))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/teams/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newAnnouncement = await res.json();
      setAnnouncements([newAnnouncement, ...announcements]);
      setShowForm(false);
      setForm({ title: "", content: "", createdBy: "" });
    }
  };

  const handleEdit = (a: Announcement) => {
    setEditingId(a.id);
    setEditForm({ title: a.title, content: a.content, createdBy: a.createdBy });
  };

  const handleEditSave = async (id: string) => {
    const res = await fetch(`/api/teams/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setAnnouncements(announcements.map((a) => (a.id === id ? { ...a, ...updated } : a)));
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    const res = await fetch(`/api/teams/announcements/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAnnouncements(announcements.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Announcements</h1>
      <div className="mb-6 flex justify-between items-center">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Add Announcement"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white shadow rounded-lg p-6 mb-6 space-y-4">
          <div>
            <label className="block font-medium mb-1">Title</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Content</label>
            <textarea
              className="w-full border px-3 py-2 rounded"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Created By</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={form.createdBy}
              onChange={(e) => setForm({ ...form, createdBy: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Add
          </button>
        </form>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
          No announcements yet.
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">{a.title}</h2>
                <span className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mb-2 text-gray-700 whitespace-pre-line">{a.content}</div>
              <div className="text-sm text-gray-500 mb-2">Posted by: {a.createdBy}</div>
              {editingId === a.id ? (
                <div className="space-y-2 mb-2">
                  <input
                    className="w-full border px-3 py-2 rounded mb-2"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  />
                  <textarea
                    className="w-full border px-3 py-2 rounded mb-2"
                    value={editForm.content}
                    onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                  />
                  <input
                    className="w-full border px-3 py-2 rounded mb-2"
                    value={editForm.createdBy}
                    onChange={e => setEditForm({ ...editForm, createdBy: e.target.value })}
                  />
                  <div className="flex space-x-2">
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      onClick={() => handleEditSave(a.id)}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      onClick={() => setEditingId(null)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2 mb-2">
                  <button
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    onClick={() => handleEdit(a)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                    onClick={() => handleDelete(a.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 