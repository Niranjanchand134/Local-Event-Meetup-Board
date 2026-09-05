import type { EventItem, AttendeeRecord, ReportItem, SystemLogItem, UserProfile, AdminUserRecord } from '../types/eventboard';
export const LOGO_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuDAb7_LxrS3S0YbUEEZngQzJnqwhVfgzMU01RLW-25C__hrgKsc0vvSp6AgEOcjq-Mu9N6Jo7dNxW0VIqZmNXXPyyXwyNB_RYwRhUuOZ9oSqp8MsC6mriUEKVuX4KUeAibtXO0MSGsoJTcV2UZaXAhiuV2vbiWsugk2Yv9d4Xf3gw-BI57hPKtgkMrEbTuEbAYk9ndJ9FkgN2KtSz9KSy2G8zeziZqBQMo2HLH_bCRSturtscTuIAg";

export const USER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuC4PehM_ggTDfieaL0mNlJeSyJij5Ojwq0p7uBQXONLEy5MQlA5JjPQlrLVmSI_TwWmXZeKWUubWgGmiZRQGlauVJ0Sx1v5NaKjWv9tRIQrXSRwBkf9CDOHuLVRdI72vqd-5PyOaBfI8-wkuOl3MgVRqQEthgWbuII_u2erEpW_-LlYGjA2xxnUfMPuZnfRSeROACCfxI0SnShZOs9Src8m_B1akwpf_7pPTXv-Ygnpmf-MOazyx_c";

export const currentUser: UserProfile = {
  name: "Alex Mercer",
  role: "Senior Developer",
  avatar: USER_AVATAR,
  stats: {
    joined: 12,
    created: 3,
    upcoming: 4,
    waitlisted: 1
  }
};

export const featuredMasterclass: EventItem = {
  id: "evt-distributed-01",
  title: "Architecting Resilient Distributed Systems",
  category: "Masterclass",
  categoryLabel: "MASTERCLASS",
  badge: "LIVE IN 3 DAYS",
  badgeType: "live",
  date: "Sat, Nov 18",
  time: "10:00 AM - 4:00 PM PST",
  location: "San Francisco, CA",
  venueName: "The Cloud Hub",
  address: "450 Dev Street, Suite 900, San Francisco, CA 94105",
  transitInfo: "3 min walk from Montgomery St Station",
  parkingInfo: "Paid parking available in building",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBoCFfvJf0AVLOMXyACoFcnyY0nzblNTPe1gq89vKRXcg4lZPIPU88a4oWvXoQWhO2JXHJ0zHM85hEl658Y7uth4jRN2jLWKeDrOc6l2MTBuM4o3_gWKD1BgcrOD07JQiZ1mZRKihAF_UMYoifEBmINchAhfJMFIotGSBz79FYmsa1KXLOyNaKGsfDaqRcT0rNakLlj1sd-iXYiFtsotpi3XBR0ACtBirye0E0gPTHnKb3n2BQkac",
  price: 49.00,
  capacity: 50,
  registeredCount: 34,
  organizer: {
    name: "System Crafters",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD545yvxBlGE1cCLa-P5MNrfhmcAztsNl3mexNo_NQOZ9dd4JMDrwFzA5GRM7GLtvo0JoI5DFcFKUpDCWK6zaeFDE2RKq-gw9WhrCGDA_hBb01OfMnLnR2NnhhD-k5J3G37W95Lse0xVWp2cwpWrJ3mBqvCGUgrIpgVN1u1fKAvBJcyePDCuae10SfFsqhlr_riwEaMO-5O-KGDEuRUITYyuiPMzX1fNYCuVkb2tb8IhpHkfhynpzs",
    initials: "SC",
    pastEventsCount: 12,
    description: "Technical community dedicated to deep-dive backend architecture & engineering craftsmanship."
  },
  description: "A deep dive into building fault-tolerant microservices, chaos engineering, and scaling backend architecture for hyper-growth startups.",
  longDescription: [
    "Join us for an intensive, hands-on workshop focused on designing and operating large-scale distributed systems. This masterclass is designed for senior engineers and architects looking to level up their system design skills.",
    "We will cover real-world case studies from companies like Netflix, Uber, and Stripe, dissecting how they handle failure, manage state across data centers, and ensure zero downtime during complex migrations."
  ],
  features: [
    {
      icon: "code_blocks",
      title: "Hands-on Labs",
      description: "Build and break a miniature microservice cluster locally."
    },
    {
      icon: "bug_report",
      title: "Chaos Engineering",
      description: "Learn how to inject failures safely to build confidence in production."
    }
  ],
  schedule: [
    {
      time: "10:00 AM",
      title: "Registration & Coffee",
      description: "Settle in, grab breakfast, and network with fellow engineers."
    },
    {
      time: "10:30 AM",
      title: "Fundamentals of Resilience",
      description: "Timeouts, retries, circuit breakers, and bulkheads."
    },
    {
      time: "12:30 PM",
      title: "Lunch Break",
      description: "Catered artisanal lunch and networking."
    },
    {
      time: "1:30 PM",
      title: "Interactive Chaos Engineering Lab",
      description: "Bring your laptop. We will deploy a fragile system and work together to harden it using open-source tools."
    }
  ],
  attendees: [
    {
      name: "Marcus Aurelius",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD4Uwz4yyuI1pHUi1yp6EFDsPzuLGY4Yhhm0KFzD3iP0X_rianScfXiisSPPai600zsruy5EQ_7xHjSKdois_cDDdw7y8sWLPOdz89XA_ESHR7AYOw82N2VWXPRQ-3tvAB6C4FAi6D1-X34cVAbAn3lES3-9gl5S2jNLwaqjK4GQXm-phCc5JhjyOBRwYJFMpchYAYenl0XOOLR5U9KHTdzLNadwZpOGsbdG_h0PW3lEyHCm9n8-Mo",
      role: "Staff Engineer"
    },
    {
      name: "Elena Rostova",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuATFUOMTgsFxfzIrl51RGCJFDHNZQd0b0eLR6TcKm-ZSVHyymueHAnNOTVRdbxpxObKKlblCU2d7bNRy4XTafAR7v8ThhkvUQeeLfEWg_TyWPyCfkgYoykSG-PZPs3Ym3L9AlmfpSMdXPsTGU8aguz37NH4Qv7xuZAamj0cKPqj_Y6kK0ZtKG8vXWFPWHjRMsvA7BHaqbbDwCF6L0A1iuc0SoSAE-_JfRz9b0ubxyhWQ7Y7ftq-khE",
      role: "Distributed Systems Lead"
    },
    {
      name: "Devon Clark",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqeoTa-JudYDtYci1Ci_bzbZ6bSKghaJvnMLClGRya5V43j_a7Fz127oLBy78yI-gNGgNrEom98WbVFMJM7AN2SMJikCvJa5DJNNmtyDSxPjSmWW-52I6Hz2p6a41UFdt-5wGDACt2PeKAxbvQHUF95g4ELnP_dwV1TGtiEOEHC4NzCUVIcSS1w_4BFbjryk1CCgP-2REsvshLxG7yPmFIQCy-Wy-V7bgcYuva4vVe48WSJCsJvD8",
      role: "Infrastructure Architect"
    },
    {
      name: "Sophia Zhang",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvPqQi215MSMy--poUU0dAKY0FmzicBE9oA1AyDxQDvxB7-Qiyntyz-0HXk4B4gUKUt2uzCRseiJQqw6YiKqnu6ZvYrChBqjAP9H2dJmVJgSTZ1c6U4sB3lBU1eslL_JfVzKZiLCmfg9U4Uqj6JyTWyeh-fsXqtdGI_z1xqAeNuudR_Cmlbos2bA-cakWHqLrHO8h56wYvGdnU-y7GEEE4CVaXNkATN1niu1RfR6K7mGuUafC3GqM",
      role: "VP Engineering"
    }
  ]
};

export const sampleEvents: EventItem[] = [
  {
    id: "evt-react-summit",
    title: "Future of React Summit",
    category: "Technology",
    categoryLabel: "TECH",
    badge: "ACTIVE",
    badgeType: "live",
    date: "OCT 24, 2024",
    time: "18:00 - 21:00 EST",
    location: "Brooklyn, NY",
    venueName: "The Tech Hub, Brooklyn",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3qvuRLBnJ0ePPf7-RY8GGquToea66iXYKtoNo_6j6Slo27PpCWyF9uwNG6HMPN0PzFoNCo9Cr-NU7J4oMzG-kjt5JordzaEA1zlJYgwh3j2OTg193Bz_l1EWLIYUpjqj6smAvZloDA7QJ2q__GTQEpbRDZJBSWAM1iC373aFL_PEFhRKGtEk1vRtAhRNro_JSDFmp6cwe_EEBAsGMoof31X2VQ2TOjzE9HDAWp3tYD-2StbXoQyg",
    price: 0,
    capacity: 150,
    registeredCount: 142,
    organizer: {
      name: "React NYC Meetup",
      pastEventsCount: 24
    },
    description: "Join us for a deep dive into React Server Components, suspense, and the new concurrent rendering features with industry leaders.",
    attendees: [
      { name: "John Doe", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD1xRy8vKQZ48fktuIEhlhZPjgy2nxEEVOSdRsb2PZI7wnVbkbOdjM6LwTMKp5pUYW4atztKwFuvAaLJCUM0Wsuc0FDc0IW0PccVMlIdqkhMfZ3SQ9sbXOg8HwCEllk1rpxRsmfMu8yXuNjgEIkZywlA_Pdpn2Pydi39HFk3svH-x0wio8tENgCSWm28SI1ciQe0HvVwBlRiHQEIntSJSWk1Kbayp2bduZD4xqgyaJQJ7J8TaL_O-4" },
      { name: "Maya S.", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDq2fS4fzhh5niOF898tadaitUhe4k90u9oSInirEMF0gNsgqlHR_uLes56_LNdy43TZN8JrGfUKasrQ_2iRDO3jjo2Y64e0dNA9trrFCjV_ool8VakZlIiK_4G5l1iXYFg8cr8s8GEdd32Kusbtx9NY8Nz3L-vS7P2Y9fL9-mYTrE_f4C0uBYzZEqBw2eW5tU1KyE0YLmtEJwmyMhb2KwUAPhOG3O8zIfy77ilFtVIiH-EhE_942Q" },
      { name: "Sam Wilson", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB18bSuHFxG49466TesWt5oYyj0xC7kAD9UzMYGkIjVZWEZvGgMxGW9OHqr6Uu3tB9t5oPUeV9kvLRldXHvGoNeot1sQ4eXOESLIC5aeYpROfStpPBQnYldzUG5PbtZIscZSzfVV3T40qDi2TR_rB_UYovJm_w1Kx4yaPhq3seMXSKI2WuIy4ppzvNr-f6VeT-ZzqX-heTIV2sFs4gaqHrp0eAFtbSyygPDilBFvrGqZliWNAQUDng" }
    ]
  },
  {
    id: "evt-uiux-micro",
    title: "UI/UX Micro-Interactions",
    category: "Design",
    categoryLabel: "DESIGN",
    badge: "WORKSHOP",
    badgeType: "upcoming",
    date: "OCT 28, 2024",
    time: "10:00 - 14:00 EST",
    location: "Soho, NY",
    venueName: "Design Works, Soho",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-78Bfywu7dJeFaZLF-_tvVjrVzMbooebVaf0ZgqI1PSWwpl5qxQTGjPg2Tfvt_vl1emPoAyi-cgW1HaQKkvxkjSVN7wX4UVumC1tjQaIiwUoQ_bI45s_BzIKGqw3O4L6hjVbvyGUmMssRykR0esOdbyrDEmAeIIVVvROyTyGcDZJvWELAhmDqUJPSFKTLVX8dU5ElNRjYmgiuzoLkOXMsbyXMnUdkI00inNL3t8ZXCt1krjcmw_M",
    price: 35.00,
    capacity: 40,
    registeredCount: 38,
    organizer: {
      name: "Interaction Studio",
      pastEventsCount: 8
    },
    description: "A hands-on workshop focused on crafting delightful micro-interactions using Framer Motion and advanced CSS techniques.",
    attendees: [
      { name: "David K.", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOrGr-oPl8QUk3k2qBYAPrRz_TUNyQO0-HcA1on65dlcBLCPsmkMw-0myV-5aKv9X55eGCSwC7vsz55BFyRKto6alyn1lFDKoh_reMMMNUK-sxRsNzYNZ9PokeQn_-lMhwQoTOPdPeQB6DSEoRx3-l_sqAo7eZwahWXfF0kbBoGqj5wOmv9PbHRv4KLEqN8F9iX32tPMSp5l6xdwovslJ93hbQKJeiWVUCjXdRVXiVh_YjLYoFDPI" },
      { name: "Anna Bell", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCPvm3ji0DFEMZYXd5zHZwSZDGtw9bhScRsGCoYkd9b7MCihFPcAaLIPmSFcoZR0oMxKLM3jmJvJYrfWA5fwDqqX8iBzD8SbOe74MvhCHHXR7FrVPb1ojmM17xx65vz1tPxOWxBKPL8T-6YCibmiVeShJffM-x_KYX9L6AUtwk4agqbsR5DGpWsptGIISo6estssIYbFPzcFwrjqjWA0wvlV4YQwpAocLyUjKS_DGt0W1LGzmL2FE" }
    ]
  },
  {
    id: "evt-startup-mixer",
    title: "Startup Founders Mixer",
    category: "Business",
    categoryLabel: "BUSINESS",
    badge: "NETWORKING",
    badgeType: "upcoming",
    date: "NOV 02, 2024",
    time: "19:00 - 23:00 EST",
    location: "Manhattan, NY",
    venueName: "The Rooftop, Manhattan",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxYqFMeRA09qbytcNQAA4Mtpc5W_k36tzFuLMKwSOxt6pqoYAz9hdrKigGq567aPXqe5Sj3_mhjuTmWvOBA_lljV68I5DyOuEVW3rWMZGwba1YyyDEewzGB_4Uzrplmt0W5Suw6Daq6jXpG6J7jkD2vFUkWIO2A-y7GsF7EhFdXH65Je0RuSQ7X3AiYG_8dp-t_Le_QKfxHdUmfovLhlG7zb1LTycvsNoNBc8sLjLVUiugDEnuSTU",
    price: 0,
    capacity: 100,
    registeredCount: 85,
    organizer: {
      name: "NYC Founders Club",
      pastEventsCount: 15
    },
    description: "Connect with fellow founders, early-stage investors, and potential co-founders in an informal setting.",
    attendees: []
  },
  {
    id: "evt-tokyo-dist",
    title: "Distributed Systems Architecture Summit 2024",
    category: "Conference",
    categoryLabel: "CONFERENCE // TOKYO",
    badge: "ALMOST FULL",
    badgeType: "almost-full",
    date: "OCT 24, 2024",
    time: "09:00 AM JST",
    location: "Tokyo, Japan",
    venueName: "TOKYO INTERNATIONAL FORUM",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuACnljxqjdWF3t7agi3K8RL__tOrONK_MQd5G_x7K4lDvVe383AJSLyfN7unlUuTocrLnIK0EpE-ae0ysciP6R9ruLjewavNhuNxoT6J3ZxLmvBjQaqpWhMqt0jakptU3BjRqX3kkcPtGwQrtfiYOxP3DQBpFvhqv1HKmmT4kE_fT3oTdeVFdtTCm09qjCAoRcA4slV_g9BBGv7ubQuzrlp1qyT5FiP5LkoOkunggdCfLWrm2HolcY",
    price: 120.00,
    capacity: 250,
    registeredCount: 242,
    organizer: {
      name: "Tokyo System Crafters",
      pastEventsCount: 9
    },
    description: "Deep dive into global consensus, database shard topology, and ultra low-latency packet routing for Asian financial infrastructure.",
    attendees: [
      { name: "Yuki Tanaka", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpFgyKqQWyazWAne7wxRrOfAwh5Gid-Oey93aLZP2OfuEBX1MwtLpkXHXV11c5Xpl029VpqqR5_L-QR-pnJmRhMoY5Y2VEOeDBDwCp-1xzh4FqXr0kJ_Z_X5eh1-itNzl4TvL_Uom8n3W-G8wT6_-ueH2piU2Ss-_KYIbYbGUuIjjoXKlAmZxtvwwUXFwa_jjYaoBjs-eEaZTYklRmqA54t0EOf6TkjYdMy5LJSmFKBc05ADEZHUY" },
      { name: "Kenji Sato", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuUd7xxyXw8hc-5VBEaQ1oUE09itoNzicBxuEFXNNOVn7ZXQuhcxlozWQ1H4X1nNktErV6dXanHcaxM95lGwm2zQAlfhBIuIkOQYZN0_RQn0BbLIusadURCPX0xC5Db8HBcGij139F2pZFOie6MUpNyAHifJ6IK2sUI1qNTvZuMtj9gGu9_llTB_Z21mhPTUIkqcOg0QHsy19v8bwuk1rYqif-7rMsB5GaYhyX3e4oVdW8J4XeEOY" }
    ]
  },
  {
    id: "evt-webgl-berlin",
    title: "Advanced WebGL & Shader Patterns",
    category: "Workshop",
    categoryLabel: "WORKSHOP // BERLIN",
    badge: "UPCOMING",
    badgeType: "upcoming",
    date: "NOV 12, 2024",
    time: "14:00 PM CET",
    location: "Berlin, Germany",
    venueName: "FACTORY BERLIN GÖRLITZER PARK",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkrb8LuLMM7Eq0InLl7kPtgvGpf3-VidfbSyL0-6ak78LRDMrenhtuJIwoU-TlTPZeLiqP2Hjm8JM9fC4qWRHeBBeQgjDETIMl1Lo7kazaYwnlkLNjHwJtUirP15I3Iz4zZfczwM8QzHqtmur0gNE6H3Mi9CtT2HGPcb3QPKV4D56h2EIJablw1JKk-_Jfzg32QL-ydVAiuBZdDfam4PhXeZWfiaus03WEqJDa-i-rbC8F6OOUIco",
    price: 65.00,
    capacity: 60,
    registeredCount: 42,
    organizer: {
      name: "Creative Coding Berlin",
      pastEventsCount: 16
    },
    description: "Practical shader programming with GLSL, post-processing pipelines in Three.js, and GPU particle physics computation.",
    attendees: [
      { name: "Lukas Weber", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDa4AYBBCNy_YGp5GEpziV6lXRgorc5i56x_i5uNoQoDa-eHNi6hjUzAjrl1yFzrEMiv3SDfNfU5_jeVHAlmcM7g7_l9L3fY7KUv8GIOM1UsqFx-mm3hUfDoOq4UPqU6eQD16tc_CV9F9sBESs0Mcg4oqOrixHIBs9blUkv6tr2OsINCSdc6jtCgWTwb4Dz9YaXP7DYT3MllmWM5lIyoGt-8mZyG2f0GY6gVnQucRwmA3ZFCol2vbQ" }
    ]
  },
  {
    id: "evt-sf-chip",
    title: "Bay Area AI/ML Hardware Discussion Group",
    category: "Meetup",
    categoryLabel: "MEETUP // SAN FRANCISCO",
    badge: "REGISTRATION CLOSED",
    badgeType: "closed",
    date: "SEP 05, 2024",
    time: "18:30 PM PDT",
    location: "San Francisco, CA",
    venueName: "CHIP HUB FOUNDRY",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzBBkeidkc4dw_yrLXTjoFGI6ICB5-NHu_38xb8X8gqN5wM0Wb-QaffHU01USfhcTUjBkAz1UJtga1Avy_Zzc1vgdUo3UbP49LN-i-bGmOvIV8ZoN4cG16mB8EgfV8idvEs6gLQaAjSp9-EapS7nyqHL1M1GGqogJKDDLMYYkBh2MbrX57PI2U9shU42pquNJlvjw35eO9eo2cg6NE6ptDQtvyRzqiLhFTyVU7stMY9w1wwNtzUNg",
    price: 0,
    capacity: 200,
    registeredCount: 200,
    organizer: {
      name: "Silicon Foundry Club",
      pastEventsCount: 30
    },
    description: "Next-gen TPU architectures, optical interconnects, and SRAM wafer-scale compute limits.",
    attendees: []
  }
];

export const hostManagedEvent = {
  id: "EVT-9942",
  title: "Modern Web Arch Summit",
  statusBadge: "LIVE EVENT",
  description: "Manage attendees, view analytics, and update event details for your upcoming technical summit.",
  metrics: {
    totalAttendees: 342,
    maxCapacity: 400,
    confirmed: 290,
    waitlisted: 52,
    trendPercent: 85
  },
  attendees: [
    {
      id: "att-1",
      name: "Alex Chen",
      email: "alex.c@example.com",
      role: "Senior Engineer",
      rsvpDate: "2024-10-12 09:41",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3ezNGNJaM5iy4D3QrbyVrbv923h7keR4npJa97hJsyBIUpR8lijCMiTroi_3oot4OesG747JVIzWbyn4ql9Lc9VLy3CtE-aNEkkIes-SAoRjhIpi-pmKNPghpns-WvLEfNvD60Hpd_S6U-LEXETtcVLIyjy2IwnD-3PtunsNGesW--Fp_PDLfuf5-id1blpvDPAcC5HgMa58Dn47jdu-fTDbhyg1hjOMZrdIqvXh_sq70CtRv3v8",
      status: "confirmed"
    },
    {
      id: "att-2",
      name: "Sarah Jenkins",
      email: "s.jenkins@techcorp.io",
      role: "Product Manager",
      rsvpDate: "2024-10-12 11:20",
      initials: "SJ",
      status: "confirmed"
    },
    {
      id: "att-3",
      name: "Dr. Maya Patel",
      email: "mpatel@research.edu",
      role: "Guest Speaker",
      rsvpDate: "2024-10-11 16:05",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBW7t7ZEOlU0Ym7TYYQCrmBjpO4QWLo-GsAfvI7cwVxhGaalkkdCqIXVRIO8JbO8CAFf2ifqwEgBmbaDt62MwlP8B9mP8uUaazzQiMvLIjLRh3FwPvkPAmflMmsob7aPD4HWp5Vl5fCNwXANuSFQJk7xh0b3VK4-ca0PF7aQaT38sUiAH7lnXvjwF7wgDDCdusqT_NYKFBB8fz38eJwsYOHXyHMB7z3Vdz4alZignqUsP_yxX8pIO0",
      status: "confirmed"
    },
    {
      id: "att-4",
      name: "Liam O'Connor",
      email: "liam.o@devops.co",
      role: "Platform Architect",
      rsvpDate: "2024-10-13 14:10",
      initials: "LO",
      status: "waitlist"
    },
    {
      id: "att-5",
      name: "Nadia Farooq",
      email: "nadia.f@cloudscale.net",
      role: "Infrastructure Lead",
      rsvpDate: "2024-10-13 17:35",
      initials: "NF",
      status: "waitlist"
    }
  ] as AttendeeRecord[]
};

export const adminReportsData: ReportItem[] = [
  {
    id: "RPT-9021",
    reportedItem: {
      title: "Underground Techno Rave",
      path: "event/underground-techno...",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGatAgdnHgR71UHMSFgnups4zmarwKInO8aAPP3NC6WI2Pc8WCSCCFjVJ5ccx2dE6o04Yp8pRVOgZXY76DYda67BfhUroc0Mq3k7mwrDQmUjE7juHE9lCEcgorZ-q79QlS-ok2fTqcBLq125p1lQltJBzj6su-W9_LLz28KvWzmSR-7tS1x6MgAsImFE3fgWNkLnU-HMPV7_RieDyVu30fxTfz_svagO7uSdZvMkaq4NYFla2r6PU",
      organizer: "u/bassdrop99",
      location: "124 Industrial Ave, Basement"
    },
    type: "event",
    reason: "Safety Violation",
    reasonDetail: "Over capacity, blocked exits with equipment boxes.",
    reporter: {
      name: "j.smith99",
      initials: "JS",
      timeAgo: "2 hours ago"
    },
    status: "OPEN",
    isUrgent: true,
    notes: "Multiple attendees reported blocked fire exits and unsafe crowded underground conditions."
  },
  {
    id: "RPT-9018",
    reportedItem: {
      title: "Harassment Comment",
      path: "comment/c-882194"
    },
    type: "comment",
    reason: "Harassment",
    reasonDetail: "Targeted insults at organizer",
    reporter: {
      name: "anon_user",
      initials: "A",
      timeAgo: "3 hours ago"
    },
    status: "REVIEWING",
    isUrgent: false
  },
  {
    id: "RPT-9015",
    reportedItem: {
      title: "CryptoKing99",
      path: "user/u-crypto99",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlmLusA116r2VOO2bvVKDupFg4aAo6wCJo911xRu5xFMN3aAJwYyjuPPQdyewM1tx_nbw6NcRydR6GmrzFndpey4PB0Wsi9TRElkuPKlLs4JkvyH1SiiMXD4Mi3tM-65hFe5a6ZQk9mmlKpCTShSE8iATCWdBNx-P-hLO7QKv-gZ5pJUs_Fydzi50Gj-3acQ-XeVJ4HsQ4rMngK8GrdqCYT0VtT34rR5L9yysWoXZE6q_k7IDa3mI"
    },
    type: "user",
    reason: "Spam",
    reasonDetail: "Posting duplicate events across 15 regions",
    reporter: {
      name: "system_auto",
      initials: "S",
      timeAgo: "5 hours ago"
    },
    status: "DISMISSED",
    isUrgent: false
  }
];

export const systemLogs: SystemLogItem[] = [
  {
    id: "log-1",
    timestamp: "10:42:01Z",
    type: "USER",
    detail: "New Signup: @sarah_dev",
    subdetail: "sarah@example.com - IP: 192.168.1.1"
  },
  {
    id: "log-2",
    timestamp: "10:15:33Z",
    type: "EVENT",
    detail: "Event Created: React Native Austin",
    subdetail: "Hosted by @tech_austin - 150 capacity"
  },
  {
    id: "log-3",
    timestamp: "09:55:12Z",
    type: "SYSTEM",
    detail: "Category Added: 'AI & ML'",
    subdetail: "Created by Admin: super_user"
  },
  {
    id: "log-4",
    timestamp: "09:12:45Z",
    type: "REPORT",
    detail: "Spam reported on Event #8932",
    subdetail: "Reported by 3 unique users"
  }
];

export const adminUsersData: AdminUserRecord[] = [
  {
    id: 'usr-1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@sys-admin.network',
    role: 'ADMIN',
    eventsCreated: 142,
    eventsJoined: 1024,
    status: 'ACTIVE',
  },
  {
    id: 'usr-2',
    name: 'David Chen',
    email: 'd.chen@external-node.io',
    role: 'USER',
    eventsCreated: 0,
    eventsJoined: 14,
    status: 'ACTIVE',
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena.r@community-hosts.org',
    role: 'ORGANIZER',
    eventsCreated: 18,
    eventsJoined: 86,
    status: 'ACTIVE',
  },
  {
    id: 'usr-4',
    name: 'Unknown Origin',
    email: 'ERR_NODE_REDACTED',
    role: 'USER',
    eventsCreated: 0,
    eventsJoined: 0,
    status: 'SUSPENDED',
  },
  {
    id: 'usr-5',
    name: 'Marcus Vance',
    email: 'm.vance@core-systems.com',
    role: 'ADMIN',
    eventsCreated: 38,
    eventsJoined: 219,
    status: 'ACTIVE',
  },
  {
    id: 'usr-6',
    name: 'Aiden Tanaka',
    email: 'aiden.t@techmeetup.tokyo',
    role: 'ORGANIZER',
    eventsCreated: 24,
    eventsJoined: 152,
    status: 'ACTIVE',
  },
];
