import { PrismaClient, Role, AccountStatus } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────
// Demo account definitions
// ─────────────────────────────────────────

interface DemoGamer {
  email: string;
  username: string;
  displayName: string;
  bio: string;
  visibility: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";
  isMember: boolean;
  pointsBalance: number;
}

interface DemoOrganiser {
  email: string;
  status: AccountStatus;
  organisationName: string;
  organisationType: string;
  website: string;
  contactPerson: string;
  contactNumber: string;
  description: string;
}

const DEMO_GAMERS: DemoGamer[] = [
  {
    email: "gamer1@demo.sg",
    username: "shadowblade",
    displayName: "ShadowBlade",
    bio: "Competitive FPS player. Valorant and CS2 grinder. Always looking for scrims!",
    visibility: "PUBLIC",
    isMember: true,
    pointsBalance: 2500,
  },
  {
    email: "gamer2@demo.sg",
    username: "pixelwitch",
    displayName: "PixelWitch",
    bio: "Indie game enthusiast and speedrunner. WR holder in Hollow Knight Any%.",
    visibility: "PUBLIC",
    isMember: true,
    pointsBalance: 4200,
  },
  {
    email: "gamer3@demo.sg",
    username: "dragonlord",
    displayName: "DragonLord",
    bio: "MOBA veteran. Dota 2 Ancient tier. Team captain for Team Chimera.",
    visibility: "MEMBERS_ONLY",
    isMember: true,
    pointsBalance: 1800,
  },
  {
    email: "gamer4@demo.sg",
    username: "neonstriker",
    displayName: "NeonStriker",
    bio: "Fighting game competitor. Top 8 at EVO SG 2025. Street Fighter 6 main.",
    visibility: "PUBLIC",
    isMember: false,
    pointsBalance: 0,
  },
  {
    email: "gamer5@demo.sg",
    username: "lunarmage",
    displayName: "LunarMage",
    bio: "RPG and MMO explorer. FFXIV raider, Genshin Impact theorycrafter.",
    visibility: "PUBLIC",
    isMember: true,
    pointsBalance: 8900,
  },
];

const DEMO_ORGANISERS: DemoOrganiser[] = [
  {
    email: "org@demo.sg",
    status: AccountStatus.APPROVED,
    organisationName: "Singapore Esports League",
    organisationType: "Association",
    website: "https://sel.sg",
    contactPerson: "Alex Tan",
    contactNumber: "+65 1234 4567",
    description:
      "The Singapore Esports League (SEL) organises competitive gaming tournaments across multiple titles including Valorant, League of Legends, and Mobile Legends. We run seasonal leagues and major LAN events.",
  },
  {
    email: "org-pending@demo.sg",
    status: AccountStatus.PENDING,
    organisationName: "Nanyang Polytechnic Gaming Club",
    organisationType: "School",
    website: "https://nyp.edu.sg/gaming",
    contactPerson: "Sarah Lim",
    contactNumber: "+65 1233 4322",
    description:
      "NYP Gaming Club brings together students passionate about esports and competitive gaming. We host internal tournaments, viewing parties, and workshops on game design and shoutcasting.",
  },
  {
    email: "org-rejected@demo.sg",
    status: AccountStatus.REJECTED,
    organisationName: "Sketchy Tournament Org",
    organisationType: "Company",
    website: "https://sketchy-tournaments.biz",
    contactPerson: "John Doe",
    contactNumber: "+65 1222 2212",
    description:
      "We run totally legitimate tournaments with guaranteed prize pools. Trust us.",
  },
];

const DEMO_SUSPENDED = {
  email: "suspended@demo.sg",
  username: "banned_user",
  displayName: "BannedUser",
  bio: "This account has been suspended by an admin.",
};

// ─────────────────────────────────────────
// Main
// ─────────────────────────────────────────

async function main() {
  console.log("🎮 Gamers.SG — Demo Data Seeder\n");
  console.log("=" .repeat(50));

  let created = 0;
  let skipped = 0;

  // ── Admin ──────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@gamers.sg";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        role: Role.ADMIN,
        status: AccountStatus.APPROVED,
      },
    });
    console.log(`Admin: ${adminEmail}`);
    created++;
  } else {
    console.log(`Admin: ${adminEmail} (already exists)`);
    skipped++;
  }

  // ── Games Library ────────────────────
  console.log("\n  ── GAMES LIBRARY ──");

  const DEMO_GAMES = [
    { name: "Valorant", slug: "valorant", category: "FPS" },
    { name: "Counter-Strike 2", slug: "counter-strike-2", category: "FPS" },
    { name: "Overwatch 2", slug: "overwatch-2", category: "FPS" },
    { name: "Rainbow Six Siege", slug: "rainbow-six-siege", category: "FPS" },
    { name: "League of Legends", slug: "league-of-legends", category: "MOBA" },
    { name: "Dota 2", slug: "dota-2", category: "MOBA" },
    { name: "Mobile Legends: Bang Bang", slug: "mobile-legends-bang-bang", category: "MOBA" },
    { name: "Apex Legends", slug: "apex-legends", category: "Battle Royale" },
    { name: "Fortnite", slug: "fortnite", category: "Battle Royale" },
    { name: "Call of Duty: Warzone", slug: "call-of-duty-warzone", category: "Battle Royale" },
    { name: "Street Fighter 6", slug: "street-fighter-6", category: "Fighting" },
    { name: "Tekken 8", slug: "tekken-8", category: "Fighting" },
    { name: "Super Smash Bros. Ultimate", slug: "super-smash-bros-ultimate", category: "Fighting" },
    { name: "EA Sports FC", slug: "ea-sports-fc", category: "Sports" },
    { name: "NBA 2K", slug: "nba-2k", category: "Sports" },
    { name: "Genshin Impact", slug: "genshin-impact", category: "RPG" },
    { name: "Final Fantasy XIV", slug: "final-fantasy-xiv", category: "RPG" },
    { name: "Minecraft", slug: "minecraft", category: "Sandbox" },
    { name: "Rocket League", slug: "rocket-league", category: "Sports" },
  ];

  for (const game of DEMO_GAMES) {
    const existing = await prisma.game.findUnique({ where: { slug: game.slug } });
    if (existing) {
      console.log(`${game.name} — already exists`);
      skipped++;
      continue;
    }
    await prisma.game.create({ data: game });
    console.log(`${game.name} (${game.category})`);
    created++;
  }

  // ── Gamers ────────────────────────────
  console.log("\n  ── GAMERS ──");

  for (const gamer of DEMO_GAMERS) {
    const existing = await prisma.user.findUnique({
      where: { email: gamer.email },
    });

    if (existing) {
      console.log(`${gamer.username} (${gamer.email}) — already exists`);
      skipped++;
      continue;
    }

    await prisma.user.create({
      data: {
        email: gamer.email,
        role: Role.GAMER,
        status: AccountStatus.APPROVED,
        gamer_profile: {
          create: {
            username: gamer.username,
            display_name: gamer.displayName,
            bio: gamer.bio,
            visibility: gamer.visibility,
            is_member: gamer.isMember,
            points_balance: gamer.pointsBalance,
          },
        },
      },
    });

    console.log(
      `${gamer.username} (${gamer.email}) — ${gamer.isMember ? "Member" : "Free"}, ${gamer.pointsBalance} pts`,
    );
    created++;
  }

  // ── Organisers ─────────────────────────
  console.log("\n  ── ORGANISERS ──");

  for (const org of DEMO_ORGANISERS) {
    const existing = await prisma.user.findUnique({
      where: { email: org.email },
    });

    if (existing) {
      const statusLabel = existing.status === AccountStatus.APPROVED
        ? "APPROVED"
        : existing.status === AccountStatus.PENDING
          ? "PENDING"
          : "REJECTED";
      console.log(`${org.organisationName} (${org.email}) — ${statusLabel} — already exists`);
      skipped++;
      continue;
    }

    // For organiser profiles, create the user & profile together
    // and set the status directly (bypassing the PENDING flow for approved orgs)
    await prisma.user.create({
      data: {
        email: org.email,
        role: Role.ORGANISER,
        status: org.status,
        organiser_profile: {
          create: {
            organisation_name: org.organisationName,
            organisation_type: org.organisationType,
            website: org.website,
            contact_person: org.contactPerson,
            contact_number: org.contactNumber,
            description: org.description,
          },
        },
      },
    });

    const statusLabel = org.status === AccountStatus.APPROVED
      ? "APPROVED"
      : org.status === AccountStatus.PENDING
        ? "PENDING"
        : "REJECTED";
    console.log(
      `${org.organisationName} (${org.email}) — ${statusLabel}`,
    );
    created++;
  }

  // ── Suspended User ────────────────────
  console.log("\n  ── OTHER ──");

  const existingSuspended = await prisma.user.findUnique({
    where: { email: DEMO_SUSPENDED.email },
  });

  if (existingSuspended) {
    console.log(`${DEMO_SUSPENDED.username} (${DEMO_SUSPENDED.email}) — already exists`);
    skipped++;
  } else {
    await prisma.user.create({
      data: {
        email: DEMO_SUSPENDED.email,
        role: Role.GAMER,
        status: AccountStatus.SUSPENDED,
        gamer_profile: {
          create: {
            username: DEMO_SUSPENDED.username,
            display_name: DEMO_SUSPENDED.displayName,
            bio: DEMO_SUSPENDED.bio,
            visibility: "PUBLIC",
            is_member: false,
            points_balance: 0,
          },
        },
      },
    });

    console.log(
      `${DEMO_SUSPENDED.username} (${DEMO_SUSPENDED.email}) — SUSPENDED`,
    );
    created++;
  }

  // ── Game Assignments ────────────────
  console.log("\n  ── GAME ASSIGNMENTS ──");

  const DEMO_GAME_ASSIGNMENTS: Record<
    string,
    { slug: string; inGameRole?: string }[]
  > = {
    shadowblade: [
      { slug: "valorant", inGameRole: "Duelist" },
      { slug: "counter-strike-2", inGameRole: "AWPer" },
      { slug: "apex-legends", inGameRole: "Fragger" },
    ],
    pixelwitch: [
      { slug: "minecraft", inGameRole: "Crafter" },
      { slug: "genshin-impact", inGameRole: "Explorer" },
    ],
    dragonlord: [
      { slug: "dota-2", inGameRole: "Mid" },
      { slug: "league-of-legends", inGameRole: "Jungle" },
      { slug: "mobile-legends-bang-bang", inGameRole: "Roamer" },
    ],
    neonstriker: [
      { slug: "street-fighter-6", inGameRole: "Main" },
      { slug: "tekken-8", inGameRole: "Sub" },
      { slug: "super-smash-bros-ultimate" },
    ],
    lunarmage: [
      { slug: "final-fantasy-xiv", inGameRole: "Healer" },
      { slug: "genshin-impact", inGameRole: "Explorer" },
      { slug: "rocket-league", inGameRole: "Casual" },
    ],
  };

  for (const [username, gameList] of Object.entries(DEMO_GAME_ASSIGNMENTS)) {
    const profile = await prisma.gamerProfile.findUnique({
      where: { username },
    });
    if (!profile) {
      console.log(`${username} — profile not found, skipping`);
      continue;
    }

    const gameSlugs = gameList.map((g) => g.slug);
    const games = await prisma.game.findMany({
      where: { slug: { in: gameSlugs } },
    });
    const gameBySlug = new Map(games.map((g) => [g.slug, g.id]));

    const data = gameList
      .filter((g) => gameBySlug.has(g.slug))
      .map((g) => ({
        profile_id: profile.id,
        game_id: gameBySlug.get(g.slug)!,
        in_game_role: g.inGameRole || null,
      }));

    if (data.length > 0) {
      await prisma.gamerProfileGame.createMany({ data });
      const assigned = data.map((d) => {
        const slug = games.find((g) => g.id === d.game_id)?.slug;
        return `${slug}${d.in_game_role ? ` (${d.in_game_role})` : ""}`;
      });
      console.log(`${username} → ${assigned.join(", ")}`);
    }
  }

  // Summary Report
  console.log("\n" + "=" .repeat(50));
  console.log(`  Created: ${created}  |  Skipped: ${skipped}  |  Total: ${created + skipped}`);
  console.log("\n Demo login flow:");
  console.log("    1. Go to http://localhost:3001/login");
  console.log("    2. Enter any demo email");
  console.log("    3. Check the backend console for the magic link URL");
  console.log("\n Demo accounts:");
  console.log("    admin@gamers.sg          — ADMIN");
  console.log("    gamer1@demo.sg           — GAMER (member, 2500 pts)");
  console.log("    gamer2@demo.sg           — GAMER (member, 4200 pts)");
  console.log("    gamer3@demo.sg           — GAMER (member, 1800 pts)");
  console.log("    gamer4@demo.sg           — GAMER (free tier)");
  console.log("    gamer5@demo.sg           — GAMER (member, 8900 pts)");
  console.log("    org@demo.sg              — ORGANISER (approved)");
  console.log("    org-pending@demo.sg      — ORGANISER (pending review)");
  console.log("    org-rejected@demo.sg     — ORGANISER (rejected)");
  console.log("    suspended@demo.sg        — GAMER (suspended)");
  console.log("");
}

main()
  .catch((e) => {
    console.error("Demo data seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
