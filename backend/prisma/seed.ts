import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type CollaborationStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Shared demo password for every seeded account (documented in README).
const DEMO_PASSWORD = "naano-demo-pass";

const eur = (euros: number) => Math.round(euros * 100);

type CreatorSeed = {
  email: string;
  name: string;
  headline: string;
  niche: string;
  country: string;
  followers: number;
  rateEuros: number;
  cardPublished?: boolean;
  bio?: string;
};

const creators: CreatorSeed[] = [
  {
    email: "amelie.dubois@creator.naano.test",
    name: "Amélie Dubois",
    headline: "DevOps lead writing about platform engineering",
    niche: "DevOps",
    country: "France",
    followers: 18400,
    rateEuros: 240,
    bio: "Ex-SRE. I write about developer platforms, CI/CD and reliability.",
  },
  {
    email: "marcus.hale@creator.naano.test",
    name: "Marcus Hale",
    headline: "Making AI/ML approachable for product teams",
    niche: "AI/ML",
    country: "United Kingdom",
    followers: 42300,
    rateEuros: 480,
    bio: "Applied ML engineer. Threads on shipping models that matter.",
  },
  {
    email: "sofia.rossi@creator.naano.test",
    name: "Sofia Rossi",
    headline: "SaaS growth operator | PLG & retention",
    niche: "SaaS growth",
    country: "Italy",
    followers: 9600,
    rateEuros: 160,
    bio: "Growth at two Series B SaaS. I share PLG playbooks.",
  },
  {
    email: "daniel.okafor@creator.naano.test",
    name: "Daniel Okafor",
    headline: "Fintech builder | payments & compliance",
    niche: "Fintech",
    country: "Nigeria",
    followers: 27500,
    rateEuros: 320,
    bio: "Payments infra. Demystifying money movement for founders.",
  },
  {
    email: "lena.andersson@creator.naano.test",
    name: "Lena Andersson",
    headline: "Cybersecurity awareness for engineering orgs",
    niche: "Cybersecurity",
    country: "Sweden",
    followers: 15100,
    rateEuros: 220,
    bio: "AppSec. Threat modelling, secure defaults, and less fear.",
  },
  {
    email: "raj.patel@creator.naano.test",
    name: "Raj Patel",
    headline: "Product management, told through real shipping stories",
    niche: "Product",
    country: "India",
    followers: 33800,
    rateEuros: 300,
    bio: "PM leader. Discovery, prioritisation, and saying no.",
  },
  {
    email: "clara.mendes@creator.naano.test",
    name: "Clara Mendes",
    headline: "Product design & DesignOps for B2B tools",
    niche: "Design",
    country: "Portugal",
    followers: 7200,
    rateEuros: 130,
    bio: "Designer. Systems, accessibility, and honest critique.",
  },
  {
    email: "tom.becker@creator.naano.test",
    name: "Tom Becker",
    headline: "B2B sales that doesn't feel gross",
    niche: "Sales",
    country: "Germany",
    followers: 21900,
    rateEuros: 260,
    bio: "Sales leader. Pipeline, discovery calls, and human outreach.",
  },
  {
    email: "yuki.tanaka@creator.naano.test",
    name: "Yuki Tanaka",
    headline: "Data & analytics engineering in plain language",
    niche: "Data/Analytics",
    country: "Japan",
    followers: 12600,
    rateEuros: 200,
    bio: "Analytics engineer. dbt, warehouses, and trustworthy metrics.",
  },
  {
    email: "nadia.hassan@creator.naano.test",
    name: "Nadia Hassan",
    headline: "HR-tech & the future of work",
    niche: "HR-tech",
    country: "United Arab Emirates",
    followers: 5400,
    rateEuros: 90,
    bio: "People ops. Hiring, culture, and tools that respect humans.",
  },
  {
    email: "peter.novak@creator.naano.test",
    name: "Peter Novák",
    headline: "DevRel: developer experience & community",
    niche: "DevRel",
    country: "Czech Republic",
    followers: 16700,
    rateEuros: 210,
    bio: "Developer advocate. DX, docs, and healthy communities.",
  },
  {
    email: "grace.kim@creator.naano.test",
    name: "Grace Kim",
    headline: "Cloud architecture & cost optimisation",
    niche: "Cloud",
    country: "South Korea",
    followers: 24100,
    rateEuros: 290,
    bio: "Cloud architect. Well-architected, without the bill shock.",
  },
  {
    email: "oliver.smith@creator.naano.test",
    name: "Oliver Smith",
    headline: "Marketing ops & lifecycle for SaaS",
    niche: "Marketing Ops",
    country: "United States",
    followers: 8900,
    rateEuros: 150,
    bio: "MarOps. Attribution, lifecycle, and clean data.",
  },
  {
    email: "fatima.zahra@creator.naano.test",
    name: "Fatima Zahra",
    headline: "Founder-led content for early-stage B2B",
    niche: "Founder-led",
    country: "Morocco",
    followers: 3100,
    rateEuros: 60,
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
    rateEuros: 110,
    bio: "Copywriter. Messaging, positioning, and fewer buzzwords.",
  },
];

type BrandSeed = {
  email: string;
  company: string;
  website: string;
  walletEuros: number;
};

const brands: BrandSeed[] = [
  {
    email: "growth@runanywhere.naano.test",
    company: "RunAnywhere",
    website: "https://runanywhere.example.com",
    walletEuros: 5000,
  },
  {
    email: "marketing@northwind.naano.test",
    company: "Northwind SaaS",
    website: "https://northwind.example.com",
    walletEuros: 3200,
  },
];

async function clear() {
  // Child -> parent order to respect FKs.
  await prisma.deliverable.deleteMany();
  await prisma.collaboration.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.brandProfile.deleteMany();
  await prisma.user.deleteMany();
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
    const profile = await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        name: c.name,
        headline: c.headline,
        niche: c.niche,
        country: c.country,
        followers: c.followers,
        ratePerPostCents: eur(c.rateEuros),
        cardPublished: c.cardPublished ?? true,
        bio: c.bio,
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
        walletBalanceCents: eur(b.walletEuros),
      },
    });
    brandProfiles.push(profile);
  }

  const [runAnywhere, northwind] = brandProfiles;

  // Campaigns (4)
  const campRunA = await prisma.campaign.create({
    data: {
      brandProfileId: runAnywhere.id,
      title: "Developer platform launch",
      brief: "Announce our new self-serve developer platform to senior engineers. Focus on reliability and DX. One authentic LinkedIn post per creator.",
      budgetCents: eur(2400),
      status: "active",
    },
  });
  const campRunB = await prisma.campaign.create({
    data: {
      brandProfileId: runAnywhere.id,
      title: "Cost optimisation thought leadership",
      brief: "Educate cloud architects on cutting spend without downtime. Data-backed takes welcome.",
      budgetCents: eur(1600),
      status: "draft",
    },
  });
  const campNwA = await prisma.campaign.create({
    data: {
      brandProfileId: northwind.id,
      title: "PLG playbook series",
      brief: "Share product-led growth tactics with SaaS operators. Real numbers over theory.",
      budgetCents: eur(2000),
      status: "active",
    },
  });
  const campNwB = await prisma.campaign.create({
    data: {
      brandProfileId: northwind.id,
      title: "Security for fast-moving teams",
      brief: "Reassure engineering leaders that shipping fast and staying secure can coexist.",
      budgetCents: eur(1200),
      status: "draft",
    },
  });

  // Helper to find a creator profile by niche
  const byNiche = (niche: string) => {
    const p = creatorProfiles.find((cp) => cp.niche === niche);
    if (!p) throw new Error(`No seeded creator for niche ${niche}`);
    return p;
  };

  // Collaborations (6) — one per status.
  type CollabSeed = {
    campaignId: string;
    creatorNiche: string;
    status: CollaborationStatus;
    rateEuros: number;
    deliverable?: {
      status: "pending" | "submitted" | "approved";
      draftUrl?: string;
      submitted?: boolean;
    };
  };

  const collabs: CollabSeed[] = [
    {
      campaignId: campRunA.id,
      creatorNiche: "DevOps",
      status: "invited",
      rateEuros: 240,
    },
    {
      campaignId: campRunA.id,
      creatorNiche: "Cloud",
      status: "accepted",
      rateEuros: 290,
    },
    {
      campaignId: campRunA.id,
      creatorNiche: "Cybersecurity",
      status: "declined",
      rateEuros: 220,
    },
    {
      campaignId: campNwA.id,
      creatorNiche: "SaaS growth",
      status: "draft_submitted",
      rateEuros: 160,
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
      rateEuros: 300,
      deliverable: {
        status: "approved",
        draftUrl: "https://www.linkedin.com/posts/raj-patel-plg-live",
        submitted: true,
      },
    },
    {
      campaignId: campRunA.id,
      creatorNiche: "AI/ML",
      status: "paid",
      rateEuros: 480,
      deliverable: {
        status: "approved",
        draftUrl: "https://www.linkedin.com/posts/marcus-hale-platform-live",
        submitted: true,
      },
    },
  ];

  for (const c of collabs) {
    const creator = byNiche(c.creatorNiche);
    const collab = await prisma.collaboration.create({
      data: {
        campaignId: c.campaignId,
        creatorProfileId: creator.id,
        status: c.status,
        agreedRateCents: eur(c.rateEuros),
      },
    });
    if (c.deliverable) {
      await prisma.deliverable.create({
        data: {
          collaborationId: collab.id,
          status: c.deliverable.status,
          draftUrl: c.deliverable.draftUrl,
          submittedAt: c.deliverable.submitted ? new Date() : null,
        },
      });
    }
  }

  const counts = {
    creators: await prisma.creatorProfile.count(),
    brands: await prisma.brandProfile.count(),
    campaigns: await prisma.campaign.count(),
    collaborations: await prisma.collaboration.count(),
    deliverables: await prisma.deliverable.count(),
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
