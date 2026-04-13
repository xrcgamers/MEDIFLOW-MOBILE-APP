const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Mediflow123", 10);

  await prisma.staffUser.upsert({
    where: {
      email: "staff001@mediflow.ug",
    },
    update: {
      name: "Triage Nurse",
      staffId: "STAFF001",
      role: "Staff",
      passwordHash,
      isActive: true,
    },
    create: {
      name: "Triage Nurse",
      email: "staff001@mediflow.ug",
      staffId: "STAFF001",
      role: "Staff",
      passwordHash,
      isActive: true,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });