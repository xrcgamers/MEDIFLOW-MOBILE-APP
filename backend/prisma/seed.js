const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function upsertRole(name, description) {
  return prisma.staffRole.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
}

async function upsertCategory(name, description) {
  return prisma.resourceCategory.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
}

async function upsertAutomationRule({
  ruleCode,
  description,
  severity,
  thresholdMinutes = null,
  thresholdQuantity = null,
  isActive = true,
}) {
  return prisma.automationRule.upsert({
    where: { ruleCode },
    update: {
      description,
      severity,
      thresholdMinutes,
      thresholdQuantity,
      isActive,
    },
    create: {
      ruleCode,
      description,
      severity,
      thresholdMinutes,
      thresholdQuantity,
      isActive,
    },
  });
}

async function upsertStaffUser({
  staffId,
  name,
  email,
  password,
  roleName,
  isActive = true,
}) {
  const role = await prisma.staffRole.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error(`Missing role: ${roleName}`);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.staffUser.findFirst({
    where: {
      OR: [{ staffId }, { email }],
    },
  });

  if (existing) {
    return prisma.staffUser.update({
      where: { id: existing.id },
      data: {
        staffId,
        name,
        email,
        passwordHash,
        roleId: role.id,
        isActive,
      },
    });
  }

  return prisma.staffUser.create({
    data: {
      staffId,
      name,
      email,
      passwordHash,
      roleId: role.id,
      isActive,
    },
  });
}

async function upsertInventoryItem({
  categoryName,
  label,
  subType = null,
  status = "AVAILABLE",
  currentQuantity = null,
  availableQuantity = null,
  unitOfMeasure = null,
  location = null,
  managedByRole = null,
}) {
  const category = await prisma.resourceCategory.findUnique({
    where: { name: categoryName },
  });

  if (!category) {
    throw new Error(`Missing category: ${categoryName}`);
  }

  const existing = await prisma.resourceItem.findFirst({
    where: {
      categoryId: category.id,
      label,
      subType,
    },
  });

  if (existing) {
    return prisma.resourceItem.update({
      where: { id: existing.id },
      data: {
        status,
        currentQuantity,
        availableQuantity,
        unitOfMeasure,
        location,
        managedByRole,
      },
    });
  }

  return prisma.resourceItem.create({
    data: {
      categoryId: category.id,
      label,
      subType,
      status,
      currentQuantity,
      availableQuantity,
      unitOfMeasure,
      location,
      managedByRole,
    },
  });
}

async function main() {
  console.log("Starting MediFlow seed...");

  console.log("Seeding roles...");
  await upsertRole("ADMIN", "System administrator");
  await upsertRole("TRIAGE_NURSE", "Triage nurse");
  await upsertRole("EMERGENCY_NURSE", "Emergency nurse");
  await upsertRole("BLOOD_BANK_STAFF", "Blood bank staff");
  await upsertRole("IMAGING_STAFF", "Imaging staff");
  await upsertRole("THEATRE_STAFF", "Theatre staff");
  await upsertRole("BED_MANAGER", "Bed manager");

  console.log("Seeding categories...");
  await upsertCategory("BLOOD", "Blood stock grouped by type");
  await upsertCategory("IMAGING", "Imaging units such as X-Ray and CT");
  await upsertCategory("THEATRE", "Named theatre rooms");
  await upsertCategory("BED", "Bed pools by ward or level of care");

  console.log("Seeding automation rules...");
  await upsertAutomationRule({
    ruleCode: "LOW_BLOOD_STOCK",
    description: "Create alert when blood stock is low",
    severity: "HIGH",
    thresholdQuantity: 5,
  });

  await upsertAutomationRule({
    ruleCode: "TRIAGE_DELAY",
    description: "Create alert when patient waits too long for triage",
    severity: "HIGH",
    thresholdMinutes: 10,
  });

  await upsertAutomationRule({
    ruleCode: "RESOURCE_DELAY",
    description: "Create alert when resource request is delayed",
    severity: "HIGH",
    thresholdMinutes: 20,
  });

  await upsertAutomationRule({
    ruleCode: "IMAGING_DELAY",
    description: "Create alert when imaging request is delayed",
    severity: "HIGH",
    thresholdMinutes: 20,
  });

  await upsertAutomationRule({
    ruleCode: "INCIDENT_REVIEW_DELAY",
    description: "Create alert when incident remains under review too long",
    severity: "HIGH",
    thresholdMinutes: 15,
  });

  console.log("Seeding standard staff users...");
  await upsertStaffUser({
    staffId: "ADM-001",
    name: "System Administrator",
    email: "admin@mediflow.local",
    password: "Admin1234!",
    roleName: "ADMIN",
  });

  await upsertStaffUser({
    staffId: "TRI-001",
    name: "Triage Nurse",
    email: "triage@mediflow.local",
    password: "Staff1234!",
    roleName: "TRIAGE_NURSE",
  });

  await upsertStaffUser({
    staffId: "EMR-001",
    name: "Emergency Nurse",
    email: "emergency@mediflow.local",
    password: "Staff1234!",
    roleName: "EMERGENCY_NURSE",
  });

  await upsertStaffUser({
    staffId: "BLD-001",
    name: "Blood Bank Staff",
    email: "bloodbank@mediflow.local",
    password: "Staff1234!",
    roleName: "BLOOD_BANK_STAFF",
  });

  await upsertStaffUser({
    staffId: "IMG-001",
    name: "Imaging Staff",
    email: "imaging@mediflow.local",
    password: "Staff1234!",
    roleName: "IMAGING_STAFF",
  });

  await upsertStaffUser({
    staffId: "THR-001",
    name: "Theatre Staff",
    email: "theatre@mediflow.local",
    password: "Staff1234!",
    roleName: "THEATRE_STAFF",
  });

  await upsertStaffUser({
    staffId: "BED-001",
    name: "Bed Manager",
    email: "bedmanager@mediflow.local",
    password: "Staff1234!",
    roleName: "BED_MANAGER",
  });

  console.log("Seeding starter inventory...");
  await upsertInventoryItem({
    categoryName: "BLOOD",
    label: "Blood Stock",
    subType: "O+",
    status: "AVAILABLE",
    currentQuantity: 20,
    availableQuantity: 20,
    unitOfMeasure: "pints",
    location: "Blood Bank Main Fridge",
    managedByRole: "BLOOD_BANK_STAFF",
  });

  await upsertInventoryItem({
    categoryName: "BLOOD",
    label: "Blood Stock",
    subType: "A+",
    status: "AVAILABLE",
    currentQuantity: 12,
    availableQuantity: 12,
    unitOfMeasure: "pints",
    location: "Blood Bank Main Fridge",
    managedByRole: "BLOOD_BANK_STAFF",
  });

  await upsertInventoryItem({
    categoryName: "BLOOD",
    label: "Blood Stock",
    subType: "B+",
    status: "LOW",
    currentQuantity: 4,
    availableQuantity: 4,
    unitOfMeasure: "pints",
    location: "Blood Bank Main Fridge",
    managedByRole: "BLOOD_BANK_STAFF",
  });

  await upsertInventoryItem({
    categoryName: "BED",
    label: "Bed Pool",
    subType: "Emergency Ward",
    status: "AVAILABLE",
    currentQuantity: 18,
    availableQuantity: 10,
    unitOfMeasure: "beds",
    location: "Emergency Ward",
    managedByRole: "BED_MANAGER",
  });

  await upsertInventoryItem({
    categoryName: "BED",
    label: "Bed Pool",
    subType: "ICU",
    status: "LOW",
    currentQuantity: 8,
    availableQuantity: 2,
    unitOfMeasure: "beds",
    location: "ICU",
    managedByRole: "BED_MANAGER",
  });

  await upsertInventoryItem({
    categoryName: "IMAGING",
    label: "Imaging Unit",
    subType: "CT Scanner 1",
    status: "AVAILABLE",
    currentQuantity: 1,
    availableQuantity: 1,
    unitOfMeasure: "unit",
    location: "Imaging Department",
    managedByRole: "IMAGING_STAFF",
  });

  await upsertInventoryItem({
    categoryName: "IMAGING",
    label: "Imaging Unit",
    subType: "X-Ray Room 1",
    status: "AVAILABLE",
    currentQuantity: 1,
    availableQuantity: 1,
    unitOfMeasure: "unit",
    location: "Imaging Department",
    managedByRole: "IMAGING_STAFF",
  });

  await upsertInventoryItem({
    categoryName: "THEATRE",
    label: "Theatre Room",
    subType: "Theatre 1",
    status: "AVAILABLE",
    currentQuantity: 1,
    availableQuantity: 1,
    unitOfMeasure: "room",
    location: "Surgery Wing",
    managedByRole: "THEATRE_STAFF",
  });

  await upsertInventoryItem({
    categoryName: "THEATRE",
    label: "Theatre Room",
    subType: "Theatre 2",
    status: "AVAILABLE",
    currentQuantity: 1,
    availableQuantity: 1,
    unitOfMeasure: "room",
    location: "Surgery Wing",
    managedByRole: "THEATRE_STAFF",
  });

  console.log("MediFlow seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });