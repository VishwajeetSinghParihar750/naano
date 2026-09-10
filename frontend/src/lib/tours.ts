export type TourId =
  | "creator-card"
  | "creator-opportunities"
  | "creator-collaborations"
  | "brand-marketplace"
  | "brand-campaigns"
  | "brand-collaborations"
  | "marketing-pricing"
  | "auth-demo";

export type TourAnchor = {
  id: TourId;
  route: string;
};

/** Local knowledge of tour anchors (mirrors backend registry ids). */
export const tours: TourAnchor[] = [
  { id: "creator-card", route: "/creator/card" },
  { id: "creator-opportunities", route: "/creator/opportunities" },
  { id: "creator-collaborations", route: "/creator/collaborations" },
  { id: "brand-marketplace", route: "/brand/marketplace" },
  { id: "brand-campaigns", route: "/brand/campaigns" },
  { id: "brand-collaborations", route: "/brand/collaborations" },
  { id: "marketing-pricing", route: "/pricing" },
  { id: "auth-demo", route: "/login" },
];

export type GuideTourResult = {
  tourId: string;
  caption: string;
  route: string;
};

export const GUIDE_TOUR_EVENT = "naano:guide-tour";

export function dispatchGuideTour(result: GuideTourResult): void {
  window.dispatchEvent(
    new CustomEvent<GuideTourResult>(GUIDE_TOUR_EVENT, { detail: result }),
  );
}
