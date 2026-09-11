import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "../../lib/api";
import { formatEuroFromCents } from "./money";
import { PageError, PageHeader, PageLoading } from "./ui";
import type { BrandWalletResponse, WalletTransaction } from "./types";

const PRESETS = [2500_00, 5000_00, 10000_00, 25000_00];

type TabId = "all" | "topups" | "bookings";

export function BrandBilling() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceCents, setBalanceCents] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [tab, setTab] = useState<TabId>("all");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<BrandWalletResponse>("/brand/wallet");
      setBalanceCents(data.wallet.balanceCents);
      setTransactions(data.wallet.transactions);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load wallet.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (tab === "all") return true;
      if (tab === "topups") return t.type === "topup";
      if (tab === "bookings")
        return t.type === "booking_escrow" || t.type === "refund";
      return true;
    });
  }, [transactions, tab]);

  async function topup(amountCents: number) {
    if (busy) return;
    setBusy(true);
    setFlash(null);
    try {
      const result = await api.post<{
        balanceCents: number;
        transaction: WalletTransaction;
      }>("/brand/wallet/topup", { amountCents });
      setBalanceCents(result.balanceCents);
      setTransactions((prev) => [result.transaction, ...prev]);
      setFlash(`Added ${formatEuroFromCents(amountCents)} to your wallet.`);
    } catch (err) {
      setFlash(
        err instanceof ApiError ? err.message : "Could not top up wallet.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoading label="Loading billing…" />;
  if (error) return <PageError message={error} />;

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle="Wallet and card share one ledger. Top up to book creators into escrow."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Available balance
          </p>
          <p className="mt-2 text-4xl font-bold">
            {formatEuroFromCents(balanceCents)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Escrowed bookings debit this balance when you Book a creator.
          </p>
        </section>

        <section className="card-surface p-5">
          <h2 className="text-lg font-semibold">Add budget</h2>
          <p className="mt-1 text-sm text-muted">
            Stub top-ups — no real card charge in this build.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {PRESETS.map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={busy}
                onClick={() => void topup(amount)}
                className="btn-ghost btn-sm justify-center py-3 font-semibold disabled:opacity-60"
              >
                {formatEuroFromCents(amount)}
              </button>
            ))}
          </div>
        </section>
      </div>

      {flash ? <p className="mt-4 text-sm text-ink">{flash}</p> : null}

      <section className="card-surface mt-6 p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["topups", "Top-ups"],
              ["bookings", "Bookings"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={["tab-btn", tab === id ? "is-active" : ""]
                .filter(Boolean)
                .join(" ")}
              data-active={tab === id ? "true" : "false"}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No invoices yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-xs capitalize text-muted">
                    {t.type.replace("_", " ")} ·{" "}
                    {new Date(t.createdAt).toLocaleString("en-US")}
                  </p>
                </div>
                <span
                  className={[
                    "font-semibold",
                    t.amountCents < 0 ? "text-destructive" : "text-accent",
                  ].join(" ")}
                >
                  {t.amountCents > 0 ? "+" : ""}
                  {formatEuroFromCents(t.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
