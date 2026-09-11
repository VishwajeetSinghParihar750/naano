import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type CollaborationStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Shared demo password for every seeded account (documented in README).
const DEMO_PASSWORD = "naano-demo-pass";

/** Integer USD cents (field names keep *Cents). */
const usd = (dollars: number) => Math.round(dollars * 100);

function cardSlugFor(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "creator"}-${id.replace(/-/g, "").slice(0, 8)}`;
}

function industryFromNiche(niche: string): string[] {
  const map: Record<string, string[]> = {
    DevOps: ["Developer Tools", "SaaS"],
    "AI/ML": ["AI", "SaaS"],
    "SaaS growth": ["SaaS", "Growth/GTM"],
    Fintech: ["Fintech", "B2B"],
    Cybersecurity: ["Cybersecurity", "B2B"],
    Product: ["SaaS", "Growth/GTM"],
    Design: ["Design", "SaaS"],
    Sales: ["Sales", "B2B"],
    "Data/Analytics": ["Data/Analytics", "SaaS"],
    "HR-tech": ["HR", "SaaS"],
    DevRel: ["Developer Tools", "Marketing"],
    Cloud: ["Developer Tools", "SaaS"],
    "Marketing Ops": ["Marketing", "SaaS"],
    "Founder-led": ["B2B", "Growth/GTM"],
    "B2B copy": ["Marketing", "B2B"],
  };
  return map[niche] ?? ["B2B"];
}

type CreatorSeed = {
  email: string;
  name: string;
  headline: string;
  niche: string;
  country: string;
  followers: number;
    rateUsd: number;
  cardPublished?: boolean;
  bio?: string;
  industries?: string[];
};

const creators: CreatorSeed[] = [
  {
    email: "amelie.dubois@creator.naano.test",
    name: "Amélie Dubois",
    headline: "DevOps lead writing about platform engineering",
    niche: "DevOps",
    country: "France",
    followers: 18400,
    rateUsd: 240,
    bio: "Ex-SRE. I write about developer platforms, CI/CD and reliability.",
  },
  {
    email: "marcus.hale@creator.naano.test",
    name: "Marcus Hale",
    headline: "Making AI/ML approachable for product teams",
    niche: "AI/ML",
    country: "United Kingdom",
    followers: 42300,
    rateUsd: 480,
    bio: "Applied ML engineer. Threads on shipping models that matter.",
  },
  {
    email: "sofia.rossi@creator.naano.test",
    name: "Sofia Rossi",
    headline: "SaaS growth operator | PLG & retention",
    niche: "SaaS growth",
    country: "Italy",
    followers: 9600,
    rateUsd: 160,
    bio: "Growth at two Series B SaaS. I share PLG playbooks.",
  },
  {
    email: "daniel.okafor@creator.naano.test",
    name: "Daniel Okafor",
    headline: "Fintech builder | payments & compliance",
    niche: "Fintech",
    country: "Nigeria",
    followers: 27500,
    rateUsd: 320,
    bio: "Payments infra. Demystifying money movement for founders.",
  },
  {
    email: "lena.andersson@creator.naano.test",
    name: "Lena Andersson",
    headline: "Cybersecurity awareness for engineering orgs",
    niche: "Cybersecurity",
    country: "Sweden",
    followers: 15100,
    rateUsd: 220,
    bio: "AppSec. Threat modelling, secure defaults, and less fear.",
  },
  {
    email: "raj.patel@creator.naano.test",
    name: "Raj Patel",
    headline: "Product management, told through real shipping stories",
    niche: "Product",
    country: "India",
    followers: 33800,
    rateUsd: 300,
    bio: "PM leader. Discovery, prioritisation, and saying no.",
  },
  {
    email: "clara.mendes@creator.naano.test",
    name: "Clara Mendes",
    headline: "Product design & DesignOps for B2B tools",
    niche: "Design",
    country: "Portugal",
    followers: 7200,
    rateUsd: 130,
    bio: "Designer. Systems, accessibility, and honest critique.",
  },
  {
    email: "tom.becker@creator.naano.test",
    name: "Tom Becker",
    headline: "B2B sales that doesn't feel gross",
    niche: "Sales",
    country: "Germany",
    followers: 21900,
    rateUsd: 260,
    bio: "Sales leader. Pipeline, discovery calls, and human outreach.",
  },
  {
    email: "yuki.tanaka@creator.naano.test",
    name: "Yuki Tanaka",
    headline: "Data & analytics engineering in plain language",
    niche: "Data/Analytics",
    country: "Japan",
    followers: 12600,
    rateUsd: 200,
    bio: "Analytics engineer. dbt, warehouses, and trustworthy metrics.",
  },
  {
    email: "nadia.hassan@creator.naano.test",
    name: "Nadia Hassan",
    headline: "HR-tech & the future of work",
    niche: "HR-tech",
    country: "United Arab Emirates",
    followers: 5400,
    rateUsd: 90,
    bio: "People ops. Hiring, culture, and tools that respect humans.",
  },
  {
    email: "peter.novak@creator.naano.test",
    name: "Peter Novák",
    headline: "DevRel: developer experience & community",
    niche: "DevRel",
    country: "Czech Republic",
    followers: 16700,
    rateUsd: 210,
    bio: "Developer advocate. DX, docs, and healthy communities.",
  },
  {
    email: "grace.kim@creator.naano.test",
    name: "Grace Kim",
    headline: "Cloud architecture & cost optimisation",
    niche: "Cloud",
    country: "South Korea",
    followers: 24100,
    rateUsd: 290,
    bio: "Cloud architect. Well-architected, without the bill shock.",
  },
  {
    email: "oliver.smith@creator.naano.test",
    name: "Oliver Smith",
    headline: "Marketing ops & lifecycle for SaaS",
    niche: "Marketing Ops",
    country: "United States",
    followers: 8900,
    rateUsd: 150,
    bio: "MarOps. Attribution, lifecycle, and clean data.",
  },
  {
    email: "fatima.zahra@creator.naano.test",
    name: "Fatima Zahra",
    headline: "Founder-led content for early-stage B2B",
    niche: "Founder-led",
    country: "Morocco",
    followers: 3100,
    rateUsd: 60,
    cardPublished: false,
    bio: "Two-time founder. Building in public, mistakes included.",
  },
  {
    email: "erik.johansen@creator.naano.test",
    name: "Erik Johansen",
    headline: "B2B copywriting & positioning that converts",
    niche: "B2B copy",
    country: "Norway",
    followers: 6300,
    rateUsd: 110,
    bio: "Copywriter. Messaging, positioning, and fewer buzzwords.",
  },
];

type BrandSeed = {
  email: string;
  company: string;
  website: string;
  walletUsd: number;
};

const brands: BrandSeed[] = [
  {
    email: "growth@runanywhere.naano.test",
    company: "RunAnywhere",
    website: "https://runanywhere.example.com",
    walletUsd: 5000,
  },
  {
    email: "marketing@northwind.naano.test",
    company: "Northwind SaaS",
    website: "https://northwind.example.com",
    walletUsd: 3200,
  },
];

async function clear() {
  // Child -> parent order to respect FKs.
  await prisma.deliverable.deleteMany();
  await prisma.collaboration.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.brandProfile.deleteMany();
  await prisma.user.deleteMany();
}

/** Days ago as a Date (for staggered earnings charts). */
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await clear();

  // Creators
  const creatorProfiles = [];
  for (const c of creators) {
    const user = await prisma.user.create({
      data: { email: c.email, role: "creator", passwordHash },
    });
    const isAmelie = c.email === "amelie.dubois@creator.naano.test";
    const profile = await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        name: c.name,
        headline: c.headline,
        niche: c.niche,
        country: c.country,
        followers: c.followers,
        videoCount: isAmelie ? 48 : Math.max(12, Math.round(c.followers / 800)),
        viewCount: isAmelie ? 920_000 : c.followers * 48,
        posts7d: isAmelie ? 2 : 1,
        posts90d: isAmelie ? 14 : Math.max(3, Math.round(c.followers / 4000)),
        estImpressions: isAmelie ? 8200 : Math.round(c.followers * 0.35),
        ratePerPostCents: usd(c.rateUsd),
        cardPublished: c.cardPublished ?? true,
        bio: c.bio,
        industries: c.industries ?? industryFromNiche(c.niche),
        cardSlug: cardSlugFor(c.name, user.id),
        onboardingComplete: true,
        registrationCountry: c.country,
        taxSelfDeclared: true,
        invoiceAuthorized: true,
        ...(isAmelie
          ? {
              youtubeUrl: "https://www.youtube.com/@ameliedubois-devops",
              linkedinUrl: "https://www.linkedin.com/in/amelie-dubois-devops",
              xUrl: "https://x.com/amelie_devops",
              isRegisteredBusiness: true,
              legalName: "Amélie Dubois Consulting",
              legalAddress: "12 Rue de Lyon, 69003 Lyon, France",
              bankDetails: {
                accountHolder: "Amélie Dubois Consulting",
                iban: "FR76 ACCT-000039 7890 186",
                bankName: "BNP Paribas",
              },
            }
          : {}),
      },
    });
    creatorProfiles.push(profile);
  }

  // Brands
  const brandProfiles = [];
  for (const b of brands) {
    const user = await prisma.user.create({
      data: { email: b.email, role: "brand", passwordHash },
    });
    const profile = await prisma.brandProfile.create({
      data: {
        userId: user.id,
        company: b.company,
        website: b.website,
        walletBalanceCents: usd(b.walletUsd),
        onboardingComplete: true,
        valueProp: `${b.company} helps B2B teams run LinkedIn creator campaigns with clear briefs and tracked results.`,
        icp: [
          {
            title: "Founder / CMO",
            description: "Needs a repeatable creator motion for product launches.",
          },
          {
            title: "Demand gen manager",
            description: "Books practitioners at public USD rates into one brief.",
          },
          {
            title: "Revenue operations lead",
            description: "Wants credible LinkedIn reach into ICP accounts.",
          },
        ],
      },
    });
    brandProfiles.push(profile);
    if (b.walletUsd > 0) {
      await prisma.walletTransaction.create({
        data: {
          brandProfileId: profile.id,
          type: "topup",
          amountCents: usd(b.walletUsd),
          label: "Opening balance",
        },
      });
    }
  }

  const [runAnywhere, northwind] = brandProfiles;
  const amelie = creatorProfiles.find((cp) => cp.niche === "DevOps");
  if (!amelie) throw new Error("Amélie (DevOps) seed profile missing");

  // RunAnywhere campaigns — enough for Amélie to hold one status per campaign
  // (unique on campaignId+creatorProfileId) and for brand tabs to look full.
  const campRunPlatform = await prisma.campaign.create({
    data: {
      brandProfileId: runAnywhere.id,
      title: "Developer platform launch",
      brief:
        "Announce our new self-serve developer platform to senior engineers. Focus on reliability and DX. One authentic LinkedIn post per creator.",
      budgetCents: usd(2400),
      status: "active",
    },
  });
  const campRunCost = await prisma.campaign.create({
    data: {
      brandProfileId: runAnywhere.id,
      title: "Cost optimisation thought leadership",
      brief:
        "Educate cloud architects on cutting spend without downtime. Data-backed takes welcome.",
      budgetCents: usd(1600),
      status: "active",
    },
  });
  const campRunReliability = await prisma.campaign.create({
    data: {
      brandProfileId: runAnywhere.id,
      title: "Platform reliability series",
      brief:
        "A three-post series on SLOs, incident response, and boring reliability for B2B buyers.",
      budgetCents: usd(2000),
      status: "active",
    },
  });
  const campRunIncidents = await prisma.campaign.create({
    data: {
      brandProfileId: runAnywhere.id,
      title: "Incident postmortems for buyers",
      brief:
        "Share candid postmortem lessons that help engineering leaders trust RunAnywhere.",
      budgetCents: usd(1800),
      status: "active",
    },
  });
  const campRunArchive = await prisma.campaign.create({
    data: {
      brandProfileId: runAnywhere.id,
      title: "Self-serve DX launch (archive)",
      brief: "Completed wrap-up campaign from the self-serve DX launch quarter.",
      budgetCents: usd(1800),
      status: "completed",
    },
  });
  const campRunHiring = await prisma.campaign.create({
    data: {
      brandProfileId: runAnywhere.id,
      title: "Q4 DevRel hiring brand",
      brief: "Draft brief for hiring-brand content aimed at developer advocates.",
      budgetCents: usd(1200),
      status: "draft",
    },
  });

  // Northwind campaigns (kept for global status coverage / second brand)
  const campNwA = await prisma.campaign.create({
    data: {
      brandProfileId: northwind.id,
      title: "PLG playbook series",
      brief:
        "Share product-led growth tactics with SaaS operators. Real numbers over theory.",
      budgetCents: usd(2000),
      status: "active",
    },
  });
  const campNwB = await prisma.campaign.create({
    data: {
      brandProfileId: northwind.id,
      title: "Security for fast-moving teams",
      brief:
        "Reassure engineering leaders that shipping fast and staying secure can coexist.",
      budgetCents: usd(1200),
      status: "draft",
    },
  });

  const byNiche = (niche: string) => {
    const p = creatorProfiles.find((cp) => cp.niche === niche);
    if (!p) throw new Error(`No seeded creator for niche ${niche}`);
    return p;
  };

  type CollabSeed = {
    campaignId: string;
    creatorNiche: string;
    status: CollaborationStatus;
    rateUsd: number;
    /** Backdate collaboration.updatedAt (earnings chart). */
    updatedDaysAgo?: number;
    deliverable?: {
      status: "pending" | "submitted" | "approved";
      draftUrl?: string;
      submitted?: boolean;
    };
  };

  const collabs: CollabSeed[] = [
    // —— Amélie full funnel (one status per campaign) ——
    {
      campaignId: campRunPlatform.id,
      creatorNiche: "DevOps",
      status: "invited",
      rateUsd: 240,
    },
    {
      campaignId: campRunCost.id,
      creatorNiche: "DevOps",
      status: "accepted",
      rateUsd: 240,
    },
    {
      campaignId: campRunReliability.id,
      creatorNiche: "DevOps",
      status: "draft_submitted",
      rateUsd: 260,
      deliverable: {
        status: "submitted",
        draftUrl: "https://www.linkedin.com/posts/amelie-dubois-reliability-draft",
        submitted: true,
      },
    },
    {
      campaignId: campRunIncidents.id,
      creatorNiche: "DevOps",
      status: "live",
      rateUsd: 240,
      updatedDaysAgo: 5,
      deliverable: {
        status: "approved",
        draftUrl: "https://www.linkedin.com/posts/amelie-dubois-postmortem-live",
        submitted: true,
      },
    },
    {
      campaignId: campRunArchive.id,
      creatorNiche: "DevOps",
      status: "paid",
      rateUsd: 240,
      updatedDaysAgo: 45,
      deliverable: {
        status: "approved",
        draftUrl: "https://www.linkedin.com/posts/amelie-dubois-dx-archive",
        submitted: true,
      },
    },
    {
      campaignId: campRunHiring.id,
      creatorNiche: "DevOps",
      status: "declined",
      rateUsd: 240,
    },
    // Second invite so Opportunities isn't a single row
    {
      campaignId: campNwA.id,
      creatorNiche: "DevOps",
      status: "invited",
      rateUsd: 240,
    },

    // —— Other RunAnywhere creators (fill brand collaboration tabs) ——
    {
      campaignId: campRunPlatform.id,
      creatorNiche: "Cloud",
      status: "accepted",
      rateUsd: 290,
    },
    {
      campaignId: campRunPlatform.id,
      creatorNiche: "Cybersecurity",
      status: "declined",
      rateUsd: 220,
    },
    {
      campaignId: campRunPlatform.id,
      creatorNiche: "AI/ML",
      status: "paid",
      rateUsd: 480,
      updatedDaysAgo: 20,
      deliverable: {
        status: "approved",
        draftUrl: "https://www.linkedin.com/posts/marcus-hale-platform-live",
        submitted: true,
      },
    },
    {
      campaignId: campRunPlatform.id,
      creatorNiche: "Design",
      status: "invited",
      rateUsd: 130,
    },
    {
      campaignId: campRunCost.id,
      creatorNiche: "DevRel",
      status: "draft_submitted",
      rateUsd: 210,
      deliverable: {
        status: "submitted",
        draftUrl: "https://www.linkedin.com/posts/peter-novak-cost-draft",
        submitted: true,
      },
    },
    {
      campaignId: campRunCost.id,
      creatorNiche: "Sales",
      status: "live",
      rateUsd: 260,
      updatedDaysAgo: 8,
      deliverable: {
        status: "approved",
        draftUrl: "https://www.linkedin.com/posts/tom-becker-cost-live",
        submitted: true,
      },
    },
    {
      campaignId: campRunReliability.id,
      creatorNiche: "B2B copy",
      status: "invited",
      rateUsd: 110,
    },
    {
      campaignId: campRunIncidents.id,
      creatorNiche: "Data/Analytics",
      status: "accepted",
      rateUsd: 200,
    },

    // —— Northwind (non-Amélie) ——
    {
      campaignId: campNwA.id,
      creatorNiche: "SaaS growth",
      status: "draft_submitted",
      rateUsd: 160,
      deliverable: {
        status: "submitted",
        draftUrl: "https://www.linkedin.com/posts/sofia-rossi-plg-draft",
        submitted: true,
      },
    },
    {
      campaignId: campNwA.id,
      creatorNiche: "Product",
      status: "live",
      rateUsd: 300,
      deliverable: {
        status: "approved",
        draftUrl: "https://www.linkedin.com/posts/raj-patel-plg-live",
        submitted: true,
      },
    },
    {
      campaignId: campNwB.id,
      creatorNiche: "Cybersecurity",
      status: "invited",
      rateUsd: 220,
    },
  ];

  let escrowTotalCents = 0;
  const escrowRows: {
    brandProfileId: string;
    amountCents: number;
    label: string;
    collaborationId: string;
  }[] = [];

  for (const c of collabs) {
    const creator = byNiche(c.creatorNiche);
    const collab = await prisma.collaboration.create({
      data: {
        campaignId: c.campaignId,
        creatorProfileId: creator.id,
        status: c.status,
        agreedRateCents: usd(c.rateUsd),
        ...(c.updatedDaysAgo != null
          ? { createdAt: daysAgo(c.updatedDaysAgo + 3), updatedAt: daysAgo(c.updatedDaysAgo) }
          : {}),
      },
    });
    if (c.deliverable) {
      await prisma.deliverable.create({
        data: {
          collaborationId: collab.id,
          status: c.deliverable.status,
          draftUrl: c.deliverable.draftUrl,
          submittedAt: c.deliverable.submitted ? daysAgo(c.updatedDaysAgo ?? 2) : null,
        },
      });
    }

    // Escrow open bookings (everything except declined) on RunAnywhere only.
    const campaignBrand =
      [
        campRunPlatform,
        campRunCost,
        campRunReliability,
        campRunIncidents,
        campRunArchive,
        campRunHiring,
      ].some((camp) => camp.id === c.campaignId)
        ? runAnywhere
        : null;
    if (campaignBrand && c.status !== "declined") {
      const amountCents = usd(c.rateUsd);
      escrowTotalCents += amountCents;
      escrowRows.push({
        brandProfileId: campaignBrand.id,
        amountCents: -amountCents,
        label: `Escrow · ${creator.name} · collab`,
        collaborationId: collab.id,
      });
    }
  }

  // Wallet: opening topup already created; add mid-cycle topup + escrows, then reconcile balance.
  const midTopup = usd(1500);
  await prisma.walletTransaction.create({
    data: {
      brandProfileId: runAnywhere.id,
      type: "topup",
      amountCents: midTopup,
      label: "Card top-up",
      createdAt: daysAgo(30),
    },
  });
  for (const row of escrowRows) {
    await prisma.walletTransaction.create({
      data: {
        brandProfileId: row.brandProfileId,
        type: "booking_escrow",
        amountCents: row.amountCents,
        label: row.label,
        collaborationId: row.collaborationId,
      },
    });
  }
  // Opening was $5000; +$1500 topup; −escrows. Declined never escrowed.
  const opening = usd(5000);
  await prisma.brandProfile.update({
    where: { id: runAnywhere.id },
    data: { walletBalanceCents: opening + midTopup - escrowTotalCents },
  });

  const counts = {
    creators: await prisma.creatorProfile.count(),
    brands: await prisma.brandProfile.count(),
    campaigns: await prisma.campaign.count(),
    collaborations: await prisma.collaboration.count(),
    deliverables: await prisma.deliverable.count(),
    walletTxns: await prisma.walletTransaction.count(),
  };
  console.log("Seed complete:", counts);
  console.log(`Demo login (creator): ${creators[0].email} / ${DEMO_PASSWORD}`);
  console.log(`Demo login (brand):   ${brands[0].email} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
