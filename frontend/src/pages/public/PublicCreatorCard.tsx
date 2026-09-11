import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DealLinkCard } from "../../components/creator/DealLinkCard";
import { ApiError, api } from "../../lib/api";
import { formatUsdFromCents } from "../creator/money";

type PublicCreator = {
  name: string;
  headline: string;
  niche: string;
  country: string;
  followers: number;
  videoCount?: number;
  viewCount?: number;
  posts7d?: number;
  posts90d?: number;
  estImpressions?: number;
  ratePerPostCents: number;
  industries: string[];
  cardSlug: string;
  bio?: string | null;
};

type PublicCreatorResponse = {
  creator: PublicCreator;
};

export function PublicCreatorCard() {
  const { cardSlug } = useParams<{ cardSlug: string }>();
  const [creator, setCreator] = useState<PublicCreator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cardSlug) {
      setError("Missing card link.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .get<PublicCreatorResponse>(
        `/public/creators/${encodeURIComponent(cardSlug)}`,
      )
      .then((data) => {
        if (!cancelled) {
          setCreator(data.creator);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this creator card.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cardSlug]);

  return (
    <div className="bg-atmosphere flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <Link to="/" className="brand-mark" aria-label="naano home">
          n
        </Link>
        <Link to="/register?role=saas" className="btn-navy btn-sm">
          Book creators
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-4 py-10">
        {loading ? (
          <p className="text-sm text-muted">Loading creator card…</p>
        ) : error || !creator ? (
          <div className="card-surface w-full p-6 text-center">
            <h1 className="text-xl font-semibold text-ink">Card not found</h1>
            <p className="mt-2 text-sm text-muted">
              {error ?? "This deal link is unavailable or unpublished."}
            </p>
            <Link to="/" className="btn-ghost btn-sm mt-6 inline-flex">
              Back to naano
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Creator deal link
            </p>
            <DealLinkCard
              name={creator.name}
              headline={creator.headline}
              country={creator.country}
              industries={creator.industries}
              followers={creator.followers}
              posts7d={creator.posts7d}
              posts90d={creator.posts90d}
              estImpressions={creator.estImpressions}
              ratePerPostCents={creator.ratePerPostCents}
              dataPending={!creator.followers}
            />
            <p className="mt-6 text-center text-sm text-muted">
              Public rate{" "}
              <span className="font-semibold text-ink">
                {formatUsdFromCents(creator.ratePerPostCents)}
              </span>{" "}
              per post
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link to="/register?role=saas" className="btn-navy btn-sm">
                Join as a brand
              </Link>
              <Link to="/login" className="btn-ghost btn-sm">
                Sign in
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
