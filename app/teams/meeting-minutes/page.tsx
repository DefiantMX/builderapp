"use client";
import { useEffect, useState } from "react";

interface MeetingMinute {
  id: string;
  title: string;
  date: string;
  content: string;
  createdBy: string;
  actionItems: ActionItem[];
}
interface ActionItem {
  id: string;
  description: string;
  assignedTo?: string;
  dueDate?: string;
  completed: boolean;
}

export default function MeetingMinutesPage() {
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", createdBy: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "", createdBy: "" });
  const [actionForms, setActionForms] = useState<Record<string, { description: string; assignedTo: string; dueDate: string }>>({});
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editActionForm, setEditActionForm] = useState<{ description: string; assignedTo: string; dueDate: string }>({ description: '', assignedTo: '', dueDate: '' });

  useEffect(() => {
    fetch("/api/teams/meeting-minutes")
      .then((res) => res.json())
      .then((data) => setMinutes(data))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/teams/meeting-minutes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newMinute = await res.json();
      setMinutes([newMinute, ...minutes]);
      setShowForm(false);
      setForm({ title: "", content: "", createdBy: "" });
    }
  };

  const handleEdit = (minute: MeetingMinute) => {
    setEditingId(minute.id);
    setEditForm({ title: minute.title, content: minute.content, createdBy: minute.createdBy });
  };

  const handleEditSave = async (id: string) => {
    const res = await fetch(`/api/teams/meeting-minutes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setMinutes(minutes.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meeting minute?")) return;
    const res = await fetch(`/api/teams/meeting-minutes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMinutes(minutes.filter((m) => m.id !== id));
    }
  };

  const handleAddAction = async (minuteId: string) => {
    const form = actionForms[minuteId];
    if (!form || !form.description) return;
    const res = await fetch('/api/teams/action-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: form.description,
        assignedTo: form.assignedTo,
        dueDate: form.dueDate,
        meetingMinuteId: minuteId,
      }),
    });
    if (res.ok) {
      const newItem = await res.json();
      setMinutes(minutes.map(m => m.id === minuteId ? { ...m, actionItems: [newItem, ...(m.actionItems || [])] } : m));
      setActionForms({ ...actionForms, [minuteId]: { description: '', assignedTo: '', dueDate: '' } });
    }
  };

  const handleEditAction = (item: ActionItem) => {
    setEditingActionId(item.id);
    setEditActionForm({
      description: item.description,
      assignedTo: item.assignedTo || '',
      dueDate: item.dueDate ? item.dueDate.slice(0, 10) : '',
    });
  };

  const handleEditActionSave = async (minuteId: string, itemId: string) => {
    const res = await fetch(`/api/teams/action-items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editActionForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setMinutes(minutes.map(m => m.id === minuteId ? { ...m, actionItems: m.actionItems.map(ai => ai.id === itemId ? { ...ai, ...updated } : ai) } : m));
      setEditingActionId(null);
    }
  };

  const handleDeleteAction = async (minuteId: string, itemId: string) => {
    if (!confirm('Delete this action item?')) return;
    const res = await fetch(`/api/teams/action-items/${itemId}`, { method: 'DELETE' });
    if (res.ok) {
      setMinutes(minutes.map(m => m.id === minuteId ? { ...m, actionItems: m.actionItems.filter(ai => ai.id !== itemId) } : m));
    }
  };

  const handleToggleComplete = async (minuteId: string, item: ActionItem) => {
    const res = await fetch(`/api/teams/action-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, completed: !item.completed }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMinutes(minutes.map(m => m.id === minuteId ? { ...m, actionItems: m.actionItems.map(ai => ai.id === item.id ? { ...ai, ...updated } : ai) } : m));
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Meeting Minutes</h1>
      <div className="mb-6 flex justify-between items-center">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Add Meeting Minute"}
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
            Save
          </button>
        </form>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : minutes.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
          No meeting minutes yet.
        </div>
      ) : (
        <div className="space-y-6">
          {minutes.map((minute) => (
            <div key={minute.id} className="bg-white shadow rounded-lg p-6">
              {editingId === minute.id ? (
                <div className="space-y-2 mb-2">
                  <input
                    className="w-full border px-3 py-2 rounded mb-2"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                  <textarea
                    className="w-full border px-3 py-2 rounded mb-2"
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  />
                  <input
                    className="w-full border px-3 py-2 rounded mb-2"
                    value={editForm.createdBy}
                    onChange={(e) => setEditForm({ ...editForm, createdBy: e.target.value })}
                  />
                  <div className="flex space-x-2">
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      onClick={() => handleEditSave(minute.id)}
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
                <>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold">{minute.title}</h2>
                    <span className="text-xs text-gray-500">{new Date(minute.date).toLocaleDateString()}</span>
                  </div>
                  <div className="mb-2 text-gray-700 whitespace-pre-line">{minute.content}</div>
                  <div className="text-sm text-gray-500 mb-2">Created by: {minute.createdBy}</div>
                  <div className="flex space-x-2 mb-2">
                    <button
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      onClick={() => handleEdit(minute)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                      onClick={() => handleDelete(minute.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                      onClick={() => {
                        fetch(`/api/teams/meeting-minutes/${minute.id}/export-pdf`)
                          .then(res => res.blob())
                          .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Meeting-Minutes-${minute.id}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                          });
                      }}
                    >
                      Export PDF
                    </button>
                  </div>
                </>
              )}
              {/* Action items and export button will go here */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Action Items</h3>
                <ul className="mb-2">
                  {minute.actionItems && minute.actionItems.length > 0 ? minute.actionItems.map((item) => (
                    <li key={item.id} className="flex items-center space-x-2 mb-1">
                      {editingActionId === item.id ? (
                        <>
                          <input
                            className="border px-2 py-1 rounded mr-1"
                            value={editActionForm.description}
                            onChange={e => setEditActionForm({ ...editActionForm, description: e.target.value })}
                          />
                          <input
                            className="border px-2 py-1 rounded mr-1"
                            value={editActionForm.assignedTo}
                            onChange={e => setEditActionForm({ ...editActionForm, assignedTo: e.target.value })}
                            placeholder="Assigned To"
                          />
                          <input
                            type="date"
                            className="border px-2 py-1 rounded mr-1"
                            value={editActionForm.dueDate}
                            onChange={e => setEditActionForm({ ...editActionForm, dueDate: e.target.value })}
                          />
                          <button className="text-green-600" onClick={() => handleEditActionSave(minute.id, item.id)} type="button">Save</button>
                          <button className="text-gray-500" onClick={() => setEditingActionId(null)} type="button">Cancel</button>
                        </>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleComplete(minute.id, item)}
                            className="mr-1"
                          />
                          <span className={item.completed ? 'line-through text-gray-400' : ''}>{item.description}</span>
                          {item.assignedTo && <span className="ml-2 text-xs text-gray-500">({item.assignedTo})</span>}
                          {item.dueDate && <span className="ml-2 text-xs text-gray-400">Due: {item.dueDate.slice(0, 10)}</span>}
                          <button className="text-blue-600 ml-2" onClick={() => handleEditAction(item)} type="button">Edit</button>
                          <button className="text-red-600 ml-2" onClick={() => handleDeleteAction(minute.id, item.id)} type="button">Delete</button>
                        </>
                      )}
                    </li>
                  )) : <li className="text-gray-400">No action items.</li>}
                </ul>
                <form
                  className="flex flex-wrap items-center space-x-2"
                  onSubmit={e => { e.preventDefault(); handleAddAction(minute.id); }}
                >
                  <input
                    className="border px-2 py-1 rounded mb-2"
                    value={actionForms[minute.id]?.description || ''}
                    onChange={e => setActionForms({ ...actionForms, [minute.id]: { ...actionForms[minute.id], description: e.target.value } })}
                    placeholder="Add action item..."
                    required
                  />
                  <input
                    className="border px-2 py-1 rounded mb-2"
                    value={actionForms[minute.id]?.assignedTo || ''}
                    onChange={e => setActionForms({ ...actionForms, [minute.id]: { ...actionForms[minute.id], assignedTo: e.target.value } })}
                    placeholder="Assigned To"
                  />
                  <input
                    type="date"
                    className="border px-2 py-1 rounded mb-2"
                    value={actionForms[minute.id]?.dueDate || ''}
                    onChange={e => setActionForms({ ...actionForms, [minute.id]: { ...actionForms[minute.id], dueDate: e.target.value } })}
                  />
                  <button type="submit" className="px-2 py-1 bg-green-600 text-white rounded mb-2">Add</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 