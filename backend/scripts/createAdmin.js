const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

async function main() {
  const role = await prisma.staffRole.findUnique({
    where: { name: "ADMIN" },
  });

  if (!role) {
    throw new Error(
      "ADMIN role not found. Run `node prisma/seed.js` after `npx prisma db push` first."
    );
  }

  const password = "Admin1234!";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.staffUser.upsert({
    where: {
      email: "admin@mediflow.local",
    },
    update: {
      name: "System Administrator",
      staffId: "ADM-001",
      passwordHash,
      roleId: role.id,
      isActive: true,
    },
    create: {
      name: "System Administrator",
      email: "admin@mediflow.local",
      staffId: "ADM-001",
      passwordHash,
      roleId: role.id,
      isActive: true,
    },
    include: {
      role: true,
    },
  });

  console.log("Admin ready:", admin.email);
  console.log("Password:", password);
  console.log("Role:", admin.role.name);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });