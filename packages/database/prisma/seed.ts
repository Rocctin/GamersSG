import { PrismaClient, Role, AccountStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed an initial ADMIN user for first login
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@gamers.sg";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Admin user ${adminEmail} already exists — skipping seed.`);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      role: Role.ADMIN,
      status: AccountStatus.APPROVED,
    },
  });

  console.log(`Seeded admin user: ${admin.email} (id: ${admin.id})`);
  console.log("Use this email to request a magic link at /login");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
