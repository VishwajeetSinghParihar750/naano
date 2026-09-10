import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  GUIDE_TOUR_EVENT,
  type GuideTourResult,
} from "../../lib/tours";

type PointerState = {
  tourId: string;
  caption: string;
  top: number;
  left: number;
};

const FIND_ATTEMPTS = 20;
const FIND_INTERVAL_MS = 100;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function findTourEl(tourId: string): Promise<HTMLElement | null> {
  for (let i = 0; i < FIND_ATTEMPTS; i++) {
    const el = document.querySelector<HTMLElement>(
      `[data-tour-id="${tourId}"]`,
    );
    if (el) return el;
    await wait(FIND_INTERVAL_MS);
  }
  return null;
}

function measure(el: HTMLElement): { top: number; left: number } {
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + Math.min(rect.height * 0.35, 28),
    left: rect.left + Math.min(rect.width * 0.15, 40),
  };
}

export function GuidePointer() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location.pathname);
  const [active, setActive] = useState<PointerState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    async function runTour(detail: GuideTourResult) {
      const runId = ++runIdRef.current;
      setActive(null);

      if (detail.route !== locationRef.current) {
        navigate(detail.route);
        await wait(80);
      }

      const el = await findTourEl(detail.tourId);
      if (runId !== runIdRef.current) return;
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      await wait(350);
      if (runId !== runIdRef.current) return;

      const pos = measure(el);
      setActive({
        tourId: detail.tourId,
        caption: detail.caption,
        top: pos.top,
        left: pos.left,
      });
    }

    function onTour(event: Event) {
      const custom = event as CustomEvent<GuideTourResult>;
      if (!custom.detail?.tourId) return;
      void runTour(custom.detail);
    }

    window.addEventListener(GUIDE_TOUR_EVENT, onTour);
    return () => {
      window.removeEventListener(GUIDE_TOUR_EVENT, onTour);
      runIdRef.current += 1;
    };
  }, [navigate]);

  useEffect(() => {
    if (!active) return;

    const tourId = active.tourId;

    function dismiss() {
      setActive(null);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (overlayRef.current?.contains(target)) return;
      dismiss();
    }

    function onScrollOrResize() {
      const el = document.querySelector<HTMLElement>(
        `[data-tour-id="${tourId}"]`,
      );
      if (!el) {
        dismiss();
        return;
      }
      const pos = measure(el);
      setActive((prev) =>
        prev ? { ...prev, top: pos.top, left: pos.left } : prev,
      );
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-[70]"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute transition-transform duration-300 ease-out"
        style={{
          top: active.top,
          left: active.left,
          transform: "translate(-4px, -4px)",
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          className="drop-shadow-md"
          aria-hidden
        >
          <path
            d="M5.5 3.5 L5.5 17.5 L9.2 13.9 L12.1 20.5 L14.4 19.5 L11.4 12.7 L16.5 12.7 Z"
            fill="#0b1f3a"
            stroke="#e8f4fb"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
        <div className="pointer-events-auto mt-1 max-w-[16rem] rounded-lg border border-sky-deep/80 bg-navy px-3 py-2 text-sm leading-snug text-white shadow-lg">
          {active.caption}
          <p className="mt-1 text-[11px] text-sky/90">
            Click outside or press Esc to dismiss
          </p>
        </div>
      </div>
    </div>
  );
}
