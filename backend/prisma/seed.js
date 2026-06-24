const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PASSWORD = "Password123";

const users = [
  {
    staffId: "ADMIN001",
    name: "System Administrator",
    email: "admin@mediflow.local",
    role: "ADMIN",
  },
  {
    staffId: "EMG001",
    name: "Emergency Nurse One",
    email: "emergency@mediflow.local",
    role: "EMERGENCY_NURSE",
  },
  {
    staffId: "TRIAGE001",
    name: "Triage Nurse One",
    email: "triage@mediflow.local",
    role: "TRIAGE_NURSE",
  },
  {
    staffId: "BLOOD001",
    name: "Blood Bank Staff One",
    email: "blood@mediflow.local",
    role: "BLOOD_BANK_STAFF",
  },
  {
    staffId: "IMG001",
    name: "Imaging Staff One",
    email: "imaging@mediflow.local",
    role: "IMAGING_STAFF",
  },
  {
    staffId: "TH001",
    name: "Theatre Staff One",
    email: "theatre@mediflow.local",
    role: "THEATRE_STAFF",
  },
  {
    staffId: "BED001",
    name: "Bed Manager One",
    email: "bed@mediflow.local",
    role: "BED_MANAGER",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const user of users) {
    const role = await prisma.staffRole.upsert({
      where: { name: user.role },
      update: {},
      create: {
        name: user.role,
        description: user.role.replaceAll("_", " "),
      },
    });

    await prisma.staffUser.upsert({
      where: { email: user.email },
      update: {
        staffId: user.staffId,
        name: user.name,
        passwordHash,
        roleId: role.id,
        isActive: true,
      },
      create: {
        staffId: user.staffId,
        name: user.name,
        email: user.email,
        passwordHash,
        roleId: role.id,
        isActive: true,
      },
    });
  }

  console.log("MediFlow demo users created.");
  console.table(
    users.map((u) => ({
      role: u.role,
      email: u.email,
      password: PASSWORD,
    }))
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });