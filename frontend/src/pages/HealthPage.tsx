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
      ? "text-success"
      : status === "down"
        ? "text-destructive"
        : "text-muted";

  return (
    <main className="bg-atmosphere flex min-h-screen items-center justify-center p-6">
      <div className="card-surface w-full max-w-sm p-8 text-center">
        <h1 className="text-heading text-xl font-semibold text-ink">naano</h1>
        <p className={`mt-4 text-lg font-medium ${color}`}>{label}</p>
      </div>
    </main>
  );
}
