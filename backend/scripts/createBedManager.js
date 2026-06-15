const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

async function main() {
  const role = await prisma.staffRole.findUnique({
    where: { name: "BED_MANAGER" },
  });

  if (!role) {
    throw new Error("BED_MANAGER role not found. Run seed first.");
  }

  const password = "Staff1234!";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.staffUser.upsert({
    where: {
      email: "bedmanager@mediflow.local",
    },
    update: {
      name: "Bed Manager",
      staffId: "BED-001",
      passwordHash,
      roleId: role.id,
      isActive: true,
    },
    create: {
      name: "Bed Manager",
      email: "bedmanager@mediflow.local",
      staffId: "BED-001",
      passwordHash,
      roleId: role.id,
      isActive: true,
    },
    include: {
      role: true,
    },
  });

  console.log("Bed Manager ready:", user.email);
  console.log("Staff ID:", user.staffId);
  console.log("Password:", password);
  console.log("Role:", user.role.name);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });