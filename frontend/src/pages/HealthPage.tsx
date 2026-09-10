import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Status = "pending" | "ok" | "down";

export function HealthPage() {
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ ok: boolean }>("/health")
      .then((data) => {
        if (!cancelled) setStatus(data.ok ? "ok" : "down");
      })
      .catch(() => {
        if (!cancelled) setStatus("down");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const label =
    status === "pending" ? "API: …" : status === "ok" ? "API: ok" : "API: down";
  const color =
    status === "ok"
      ? "text-green-600"
      : status === "down"
        ? "text-red-600"
        : "text-gray-500";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-semibold text-gray-900">Naano (rebuild)</h1>
        <p className={`mt-4 text-lg font-medium ${color}`}>{label}</p>
      </div>
    </main>
  );
}
