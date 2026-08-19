/**
 * SINGLE SOURCE OF TRUTH
 *
 * Every string the site renders lives here. Sections import from this module
 * and never hardcode copy, so the content can be edited without touching a
 * component or re-deriving a layout.
 *
 * Facts (name, location, contact, stack, prices, project details) are carried
 * over verbatim from the previous site. Only the voice around them changed.
 */

export const profile = {
  name: "Muhammad Dawood Naeem",
  short: "Dawood",
  role: "Full-Stack Developer · 3D Web Engineer · Agentic AI Builder",
  location: "Daska, District Sialkot, Punjab, Pakistan",
  locationShort: "Daska, Pakistan",
  timezone: "PKT · UTC+5",
  years: 2,
  email: "hicontactdawood@gmail.com",
  phone: "03130103533",
  phoneHref: "+923130103533",
  available: true,

  /** Two lines. The whole positioning has to survive being read in six seconds. */
  headline: ["Systems", "that run."],
  headlineAccent: "run",

  intro:
    "I build the software businesses actually operate on — production back-ends, spatial WebGL interfaces, and autonomous AI agents, treated as one discipline instead of three.",

  about: [
    "I'm Dawood — a full-stack and 3D web developer, agentic AI engineer, and independent tech freelancer based in Daska, Punjab, Pakistan.",
    "Two years in, I've settled into the intersection most developers avoid: production-grade back-ends, spatial WebGL interfaces, and autonomous AI systems, built as one coherent discipline rather than three separate skillsets.",
    "I take a project from a blank repository to a client who trusts it enough to run their business on it.",
  ],

  stack: [
    { label: "Languages", items: ["C", "Python", "Java", "PHP", "TypeScript", "CSS"] },
    { label: "Frameworks", items: ["Next.js", "React", "Vue"] },
    { label: "Tools", items: ["Git", "Figma", "Framer"] },
  ],

  /**
   * Placeholder destinations carried over from the previous site — swap in the
   * real profile URLs before launch.
   */
  socials: [
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: "https://linkedin.com/" },
    { label: "X", href: "https://x.com/" },
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "Facebook", href: "https://facebook.com/" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Manifesto — the three principles, used as the statement section            */
/* -------------------------------------------------------------------------- */

export const manifesto = {
  statement: [
    "Most sites are built to be looked at.",
    "I build things that are used.",
  ],
  body: [
    "In a market full of templates, the rare thing is a system that holds up — under real traffic, real data, and a client who has to run their business on it on a Tuesday morning.",
    "Most of what gets shipped looks finished and behaves like a demo. It photographs well, it wins the pitch, and then the first hundred real users find the edges nobody scoped: the form that loses data on a flaky connection, the dashboard that takes nine seconds on a mid-range phone, the integration that quietly stops syncing at 2am.",
    "I build for the Tuesday morning, not the launch day. That means the boring parts get the same attention as the visible ones — schemas designed before screens, error states written before the happy path, and performance treated as a budget rather than a wish.",
  ],
  principles: [
    {
      n: "01",
      title: "Structure is information",
      body: "How a system is organised should tell you how it thinks. Numbering, naming and layout aren't decoration — they're documentation that can't go stale.",
    },
    {
      n: "02",
      title: "Motion should be earned",
      body: "Every animation has to justify its own existence. Movement that responds to the user is craft; movement for its own sake is latency with a marketing budget.",
    },
    {
      n: "03",
      title: "One canvas, not five",
      body: "A single continuously choreographed layer beats five that pop in and out. Continuity isn't a flourish — it's the thing that makes an interface feel real.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Capabilities — the five service pillars                                    */
/* -------------------------------------------------------------------------- */

export type Capability = {
  id: string;
  n: string;
  title: string;
  short: string;
  summary: string;
  items: string[];
};

export const capabilities: Capability[] = [
  {
    id: "web-3d",
    n: "01",
    title: "Web & 3D Development",
    short: "Web & 3D",
    summary:
      "Advanced web applications and immersive, physics-informed 3D layouts — sites that move like software, not like slideshows.",
    items: [
      "Next.js / React production builds",
      "WebGL & Three.js spatial interfaces",
      "Scroll-choreographed motion systems",
      "Performance budgets held on mobile",
    ],
  },
  {
    id: "agentic-ai",
    n: "02",
    title: "Agentic AI Engineering",
    short: "Agentic AI",
    summary:
      "Autonomous agents and intelligent systems built into the product itself — not a chat widget bolted onto the side of it.",
    items: [
      "Agent orchestration & tool use",
      "LLM integration at production scale",
      "RAG pipelines & knowledge retrieval",
      "Evaluation, guardrails, cost tuning",
    ],
  },
  {
    id: "app-dev",
    n: "03",
    title: "App Development",
    short: "Apps",
    summary:
      "Responsive native and cross-platform mobile applications, designed with the same rigour as the back-end feeding them.",
    items: [
      "Cross-platform mobile builds",
      "Responsive, offline-aware UI",
      "API-connected architectures",
      "Store-ready release engineering",
    ],
  },
  {
    id: "full-stack",
    n: "04",
    title: "Full-Stack Systems",
    short: "Full-Stack",
    summary:
      "Complete software lifecycles — databases, APIs, and the architecture that holds them together under load.",
    items: [
      "Database & schema architecture",
      "API design and integration",
      "End-to-end system ownership",
      "Deployment, CI/CD and scaling",
    ],
  },
  {
    id: "freelance",
    n: "05",
    title: "Independent Engagements",
    short: "Freelance",
    summary:
      "Complex algorithmic problems solved for enterprise and global clients — focused scopes, direct communication, no agency layer.",
    items: [
      "Algorithmic problem-solving",
      "0 → 1 builds for clients worldwide",
      "Direct, no-agency-overhead collaboration",
      "Short, tightly scoped engagements",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Work                                                                       */
/* -------------------------------------------------------------------------- */

export type Project = {
  n: string;
  name: string;
  href: string;
  domain: string;
  tag: string;
  role: string;
  year: string;
  description: string;
  /** Selects the generative visual drawn for this project. */
  visual: "toolpath" | "lattice" | "ledger";
  /** Short outcome fragments shown as a spec strip under the description. */
  facts: { k: string; v: string }[];
};

export const projects: Project[] = [
  {
    n: "01",
    name: "Fannan CNC & Wood Working",
    href: "https://publicvm.com",
    domain: "publicvm.com",
    tag: "Manufacturing → Full-Stack Platform",
    role: "Major agency engineering contract",
    year: "2025",
    description:
      "Translated a traditional, offline manufacturing workflow into an ultra-premium, high-conversion online platform — moving an entire trade that ran on phone calls and paper onto the web.",
    visual: "toolpath",
    facts: [
      { k: "Scope", v: "Full-stack platform" },
      { k: "Sector", v: "CNC manufacturing" },
      { k: "Shift", v: "Paper → web" },
    ],
  },
  {
    n: "02",
    name: "Lumina Calc",
    href: "https://publicvm.com",
    domain: "publicvm.com",
    tag: "Algorithmic Tool Development",
    role: "Independent build",
    year: "2025",
    description:
      "An advanced calculation engine that removes the formula-hunting step entirely, aggregating cross-disciplinary formulas into a single dashboard that answers instead of redirects.",
    visual: "lattice",
    facts: [
      { k: "Scope", v: "Calculation engine" },
      { k: "Sector", v: "Technical tooling" },
      { k: "Shift", v: "Search → answer" },
    ],
  },
  {
    n: "03",
    name: "Digital Committee",
    href: "https://netlify.app",
    domain: "netlify.app",
    tag: "Fintech Transformation",
    role: "Fintech transformation project",
    year: "2026",
    description:
      "Disrupted a traditional, manual cash-committee network by digitising trust metrics, payout schedules and ledger balances into one secure application.",
    visual: "ledger",
    facts: [
      { k: "Scope", v: "Secure fintech app" },
      { k: "Sector", v: "Community finance" },
      { k: "Shift", v: "Manual → ledgered" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Pricing — figures carried over as-is                                       */
/* -------------------------------------------------------------------------- */

export type Tier = {
  id: string;
  name: string;
  price: string;
  unit: string;
  volume: string;
  tagline: string;
  features: string[];
  featured?: boolean;
};

export const tiers: Tier[] = [
  {
    id: "basic",
    name: "Basic",
    price: "$100",
    unit: "one-time",
    volume: "1 website",
    tagline: "A single, focused site done properly.",
    features: [
      "1 responsive website",
      "Up to 5 pages",
      "Mobile & desktop optimised",
      "Basic on-page SEO setup",
      "Contact form integration",
      "7-day delivery",
      "14-day post-launch support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$450",
    unit: "one-time",
    volume: "5 websites",
    tagline: "For teams shipping more than one property.",
    featured: true,
    features: [
      "5 websites",
      "Unlimited pages per site",
      "Advanced SEO & performance tuning",
      "Custom animation & 3D/WebGL touches",
      "CMS integration",
      "Priority 30-day support",
      "Full source code included",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "$1,100",
    unit: "one-time",
    volume: "12 websites",
    tagline: "Full-stack systems, not just front-ends.",
    features: [
      "12 websites",
      "Full-stack + database architecture",
      "Agentic AI integration where useful",
      "Dedicated project management",
      "90-day extended support",
      "Monthly maintenance window",
      "Priority on future feature requests",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Voices & questions                                                         */
/* -------------------------------------------------------------------------- */

export const testimonials = [
  {
    name: "Zainab Ahmed",
    role: "COO, Fannan CNC",
    quote:
      "Dawood took a workflow that lived entirely offline and turned it into a platform our clients now trust by default.",
  },
  {
    name: "Tariq Mahmood",
    role: "Founder, Lumina Analytics",
    quote:
      "Every formula we needed lived in a different notebook. Now it lives in one dashboard, and it just works.",
  },
  {
    name: "Yousef Al-Sayed",
    role: "Fintech Product Director",
    quote:
      "Rare to find someone equally sharp on the engineering and the interaction design. Both showed up here.",
  },
];

export const faqs = [
  {
    q: "What kind of projects do you take on?",
    a: "Full-stack web platforms, 3D/WebGL sites, mobile apps and agentic AI systems — from a 0 → 1 build to embedding as a senior technical partner on an existing product.",
  },
  {
    q: "Do you work with international clients?",
    a: "Yes. I'm based in Daska, Punjab, Pakistan and work remotely with clients worldwide. Communication happens directly over email or WhatsApp — there's no account-manager layer in between.",
  },
  {
    q: "How do we start working together?",
    a: "Send a short brief of what you're building over email or WhatsApp. You'll get scope, timeline and next steps back — usually within a day.",
  },
  {
    q: "Do you offer ongoing support after launch?",
    a: "Yes. Every engagement can include a post-launch support window, and I'm available for longer-term retainers when a project needs continuous iteration.",
  },
  {
    q: "What's your tech stack?",
    a: "C, Python, Java, PHP, TypeScript and CSS on the language side; Next.js, React and Vue for frameworks; Git, Figma and Framer for design and version control.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Navigation — drives the nav, the section counter and the progress rail     */
/* -------------------------------------------------------------------------- */

export const sections = [
  { id: "about", n: "01", label: "About" },
  { id: "work", n: "02", label: "Work" },
  { id: "capabilities", n: "03", label: "Capabilities" },
  { id: "pricing", n: "04", label: "Pricing" },
  { id: "questions", n: "05", label: "Questions" },
  { id: "contact", n: "06", label: "Contact" },
];
