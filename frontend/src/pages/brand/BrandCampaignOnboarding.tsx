import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Clock, MapPin, Video } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/IconButton";
import type { BrandProfileResponse } from "./types";

const SLOTS = [
  "12:30",
  "12:45",
  "13:00",
  "13:15",
  "13:30",
  "13:45",
  "14:00",
  "14:15",
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
/** September 2026 starts on Tuesday — pad 2 empty cells (Sun, Mon). */
const CAL_PAD = 2;
const SELECTABLE_DAYS = new Set([11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26]);

type Step = "pick" | "details" | "done";

function formatSlot12(slot: string): string {
  const [hRaw, m] = slot.split(":").map(Number);
  const h = hRaw ?? 0;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${String(hour12).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

function endSlot(slot: string): string {
  const [hRaw, mRaw] = slot.split(":").map(Number);
  let h = hRaw ?? 0;
  let m = (mRaw ?? 0) + 15;
  if (m >= 60) {
    h += 1;
    m -= 60;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function weekdayLabel(day: number): string {
  // September 1, 2026 is a Tuesday (Sun=0 … Sat=6).
  const labels = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const wd = (1 + day) % 7;
  return labels[wd] ?? "Friday";
}

function guestNameFromEmail(email: string | undefined): string {
  if (!email) return "Brand guest";
  const local = email.split("@")[0] ?? "guest";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function BrandCampaignOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("pick");
  const [day, setDay] = useState(11);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setEmail(user?.email ?? "");
    setName(guestNameFromEmail(user?.email));
    api
      .get<BrandProfileResponse>("/brand/me")
      .then((data) => {
        if (data.profile.company?.trim()) {
          setName(data.profile.company.trim());
        }
      })
      .catch(() => {
        /* keep email-derived name */
      });
  }, [user?.email]);

  const whenLabel = useMemo(() => {
    if (!slot) return "";
    return `${weekdayLabel(day)}, September ${day} · ${slot}`;
  }, [day, slot]);

  const whenLong = useMemo(() => {
    if (!slot) return "";
    const start = formatSlot12(slot);
    const end = formatSlot12(endSlot(slot));
    return `${weekdayLabel(day)}, September ${day}, 2026 · ${start} – ${end} (Asia/Calcutta)`;
  }, [day, slot]);

  function handlePickSlot(s: string) {
    setSlot(s);
    setStep("details");
  }

  function handleConfirm(e: FormEvent) {
    e.preventDefault();
    if (confirming || !slot || !name.trim() || !email.trim()) return;
    setConfirming(true);
    // Fake booking — no backend call.
    window.setTimeout(() => {
      setConfirming(false);
      setStep("done");
    }, 450);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <IconButton
        icon={ArrowLeft}
        label="Back"
        className="border border-border"
        onClick={() => {
          if (step === "details") setStep("pick");
          else if (step === "done") setStep("details");
          else navigate("/brand/campaigns/new");
        }}
      />

      {step !== "done" ? (
        <div className="mt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            A
          </div>
          <p className="mt-3 text-sm text-muted">
            Alexis Jarre · Campaign manager · 15 min · free
          </p>
          <h1 className="text-heading mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
            Onboarding with Alexis
          </h1>
          <p className="mt-2 text-sm text-muted">
            We shape your campaign together. You leave with a clear plan.
          </p>
        </div>
      ) : null}

      {step === "pick" ? (
        <div className="card-surface mt-8 grid gap-6 p-5 lg:grid-cols-[200px_1fr_150px]">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-ink">Alexis Jarre</p>
            <p className="text-muted">naano w/Alexis</p>
            <p className="flex items-center gap-1.5 text-muted">
              <Icon icon={Clock} size="sm" />
              15m
            </p>
            <p className="flex items-center gap-1.5 text-muted">
              <Icon icon={Video} size="sm" />
              Cal Video
            </p>
            <p className="flex items-center gap-1.5 text-muted">
              <Icon icon={MapPin} size="sm" />
              Asia/Calcutta
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-ink">September 2026</p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
              {WEEKDAYS.map((d, i) => (
                <span key={`${d}-${i}`} className="py-1 font-semibold">
                  {d}
                </span>
              ))}
              {Array.from({ length: CAL_PAD }, (_, i) => (
                <span key={`pad-${i}`} />
              ))}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                const selectable = SELECTABLE_DAYS.has(d);
                const selected = d === day;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={!selectable}
                    onClick={() => setDay(d)}
                    className={[
                      "rounded-full py-2 transition",
                      selected
                        ? "bg-primary font-semibold text-primary-foreground"
                        : selectable
                          ? "hover:bg-secondary text-ink"
                          : "cursor-default text-muted/40",
                    ].join(" ")}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted">
              Booking calendar · Cal.com-style stub · no real invite is sent
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              {weekdayLabel(day).slice(0, 3)} {day}
            </p>
            {SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handlePickSlot(s)}
                className={[
                  "btn-ghost btn-sm w-full",
                  slot === s ? "border-ink bg-secondary" : "",
                ].join(" ")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "details" && slot ? (
        <form
          onSubmit={handleConfirm}
          className="card-surface mt-8 space-y-4 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Your details
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                Confirm {slot}
              </p>
            </div>
            <p className="text-sm text-muted">{whenLabel}</p>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Name
            </label>
            <input
              required
              className="field mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Email
            </label>
            <input
              required
              type="email"
              className="field mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Additional notes
            </label>
            <textarea
              rows={3}
              className="field mt-1.5 h-auto min-h-[5rem] py-2.5"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything Alexis should know before the call"
            />
          </div>

          <button
            type="submit"
            disabled={confirming}
            className="btn-ink w-full disabled:opacity-60"
          >
            {confirming ? "Confirming…" : "Confirm booking"}
          </button>
        </form>
      ) : null}

      {step === "done" && slot ? (
        <div className="mt-8 overflow-hidden rounded-[var(--radius-panel)] bg-[color:var(--footer)] px-6 py-8 text-white shadow-[var(--shadow-lg)] sm:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success text-white">
            <Icon icon={Check} size="md" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 text-center text-xl font-semibold tracking-tight">
            This meeting is scheduled
          </h2>
          <p className="mt-2 text-center text-sm text-white/70">
            We saved the details in your workspace. Add it to your calendar if
            you like.
          </p>

          <dl className="mt-8 space-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
                What
              </dt>
              <dd className="mt-1">
                15 min onboarding between Alexis Jarre and {name.trim()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
                When
              </dt>
              <dd className="mt-1">{whenLong}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
                Who
              </dt>
              <dd className="mt-1 space-y-1">
                <p>
                  Alexis Jarre{" "}
                  <span className="rounded-sm bg-accent/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky">
                    Host
                  </span>
                </p>
                <p>
                  {name.trim()}{" "}
                  <span className="rounded-sm bg-warning/25 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                    Guest
                  </span>
                </p>
                <p className="text-white/60">{email.trim()}</p>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
                Where
              </dt>
              <dd className="mt-1">Cal Video</dd>
            </div>
            {notes.trim() ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-white/50">
                  Notes
                </dt>
                <dd className="mt-1 text-white/80">{notes.trim()}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/brand/campaigns/new/ai"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-[var(--radius-pill)] bg-white px-5 text-sm font-semibold text-ink"
            >
              Create campaign with AI
            </Link>
            <Link
              to="/brand"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-[var(--radius-pill)] border border-white/25 px-5 text-sm font-semibold text-white"
            >
              Back to overview
            </Link>
          </div>
        </div>
      ) : null}

      {step === "pick" ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/brand/campaigns/new/ai" className="btn-navy btn-sm">
            Skip & create with AI
          </Link>
          <Link to="/brand/campaigns/new" className="btn-ghost btn-sm">
            Back
          </Link>
        </div>
      ) : null}
    </div>
  );
}
