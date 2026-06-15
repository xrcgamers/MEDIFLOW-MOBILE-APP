const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

const DEFAULT_PASSWORD = "Staff1234!";

const STAFF_ACCOUNTS = [
  {
    staffId: "ADM-001",
    name: "System Administrator",
    email: "admin@mediflow.local",
    roleName: "ADMIN",
    password: "Admin1234!",
  },
  {
    staffId: "TRI-001",
    name: "Triage Nurse",
    email: "triage@mediflow.local",
    roleName: "TRIAGE_NURSE",
    password: DEFAULT_PASSWORD,
  },
  {
    staffId: "EMR-001",
    name: "Emergency Nurse",
    email: "emergency@mediflow.local",
    roleName: "EMERGENCY_NURSE",
    password: DEFAULT_PASSWORD,
  },
  {
    staffId: "BLD-001",
    name: "Blood Bank Staff",
    email: "bloodbank@mediflow.local",
    roleName: "BLOOD_BANK_STAFF",
    password: DEFAULT_PASSWORD,
  },
  {
    staffId: "IMG-001",
    name: "Imaging Staff",
    email: "imaging@mediflow.local",
    roleName: "IMAGING_STAFF",
    password: DEFAULT_PASSWORD,
  },
  {
    staffId: "THR-001",
    name: "Theatre Staff",
    email: "theatre@mediflow.local",
    roleName: "THEATRE_STAFF",
    password: DEFAULT_PASSWORD,
  },
  {
    staffId: "BED-001",
    name: "Bed Manager",
    email: "bedmanager@mediflow.local",
    roleName: "BED_MANAGER",
    password: DEFAULT_PASSWORD,
  },
];

async function ensureRole(roleName) {
  const role = await prisma.staffRole.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error(`Role not found: ${roleName}. Run seed first.`);
  }

  return role;
}

async function syncStaffAccount(account) {
  const role = await ensureRole(account.roleName);
  const passwordHash = await bcrypt.hash(account.password, 10);

  const existing = await prisma.staffUser.findFirst({
    where: {
      OR: [
        { email: account.email },
        { staffId: account.staffId },
      ],
    },
    include: {
      role: true,
    },
  });

  if (existing) {
    const updated = await prisma.staffUser.update({
      where: { id: existing.id },
      data: {
        staffId: account.staffId,
        name: account.name,
        email: account.email,
        passwordHash,
        roleId: role.id,
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    return updated;
  }

  const created = await prisma.staffUser.create({
    data: {
      staffId: account.staffId,
      name: account.name,
      email: account.email,
      passwordHash,
      roleId: role.id,
      isActive: true,
    },
    include: {
      role: true,
    },
  });

  return created;
}

async function main() {
  console.log("Syncing MediFlow staff accounts...");

  const results = [];

  for (const account of STAFF_ACCOUNTS) {
    const user = await syncStaffAccount(account);
    results.push({
      staffId: user.staffId,
      email: user.email,
      role: user.role?.name,
      password: account.password,
    });
  }

  console.log("Staff account sync complete:\n");

  for (const item of results) {
    console.log(`Staff ID: ${item.staffId}`);
    console.log(`Email: ${item.email}`);
    console.log(`Role: ${item.role}`);
    console.log(`Password: ${item.password}`);
    console.log("---");
  }
}

main()
  .catch((error) => {
    console.error("Staff sync failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });