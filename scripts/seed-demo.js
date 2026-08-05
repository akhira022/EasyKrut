const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

async function main() {
  const prisma = new PrismaClient();
  const email = "demo@easykrut.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("demo user already exists:", email);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await hash("demo1234", 10);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, name: "Demo Admin", passwordHash },
    });
    const org = await tx.organization.create({
      data: {
        name: "หน่วยงานตัวอย่าง",
        slug: "demo-org",
        planKey: "free",
        seatLimit: 3,
        docLimitMonthly: 20,
        template: {
          create: {
            department: "กระทรวงตัวอย่าง",
            agencyName: "กระทรวงตัวอย่าง",
            agencyAddress: "ถนนตัวอย่าง กรุงเทพฯ ๑๐๒๐๐",
            contactUnit: "กองตัวอย่าง",
            docNumPrefix: "ตย ๐๐๑/",
          },
        },
      },
    });
    await tx.membership.create({
      data: { userId: user.id, organizationId: org.id, role: "OWNER" },
    });
  });

  console.log("created", email, "/ demo1234");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
