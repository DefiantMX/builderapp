import Link from 'next/link';

export default function TeamsPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Teams</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Meeting Minutes</h2>
          <p className="text-gray-600 mb-4">Record, view, and export your team meeting minutes.</p>
          <Link href="/teams/meeting-minutes" className="text-blue-600 hover:underline font-medium">Go to Meeting Minutes</Link>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Team Members</h2>
          <p className="text-gray-600 mb-4">See who is on your team and their roles.</p>
          <span className="text-gray-400">Coming soon</span>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Announcements</h2>
          <p className="text-gray-600 mb-4">Share important updates with your team.</p>
          <span className="text-gray-400">Coming soon</span>
        </div>
      </div>
    </div>
  );
} 