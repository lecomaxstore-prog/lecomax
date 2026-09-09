"use client";
import ResponsiveTable from "@/components/admin/ResponsiveTable";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SmartAssistantAdmin() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from("assistant_sessions")
        .select("id, platform, created_at, active, assistant_messages(count)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setSessions(data);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Smart Assistant Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 font-semibold uppercase">Total Sessions</div>
          <div className="text-4xl font-bold mt-2">{sessions.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 font-semibold uppercase">Active Now</div>
          <div className="text-4xl font-bold mt-2 text-green-600">
            {sessions.filter(s => s.active).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 font-semibold uppercase">Avg Messages / Session</div>
          <div className="text-4xl font-bold mt-2 text-blue-600">
            {sessions.length ? (sessions.reduce((acc, curr) => acc + (curr.assistant_messages?.[0]?.count || 0), 0) / sessions.length).toFixed(1) : "0"}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold">Recent Sessions</div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading data...</div>
        ) : (
          <ResponsiveTable className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Platform</th>
                <th className="p-4 font-semibold">Messages</th>
                <th className="p-4 font-semibold">Started</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs">{s.id.slice(0, 8)}...</td>
                  <td className="p-4 capitalize">{s.platform.replace("_", " ")}</td>
                  <td className="p-4">{s.assistant_messages?.[0]?.count || 0}</td>
                  <td className="p-4 text-sm text-gray-600">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {s.active ? "Active" : "Closed"}
                    </span>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No sessions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </ResponsiveTable>
        )}
      </div>
    </div>
  );
}

