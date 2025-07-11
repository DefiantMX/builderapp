"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const [form, setForm] = useState({ name: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/invite/${params.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to accept invite.");
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Accept Invitation</h1>
      {success ? (
        <div className="text-green-600">Invitation accepted! Redirecting to login...</div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
          <div>
            <label className="block font-medium mb-1">Name</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" disabled={loading}>
            {loading ? "Accepting..." : "Accept Invitation"}
          </button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </form>
      )}
    </div>
  );
}

