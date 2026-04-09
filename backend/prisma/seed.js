const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.resourceItem.count();

  if (existing > 0) {
    console.log("Seed skipped: resource items already exist.");
    return;
  }

  await prisma.resourceItem.createMany({
    data: [
      {
        category: "beds",
        label: "Emergency Beds Available",
        value: "4",
        status: "Available",
      },
      {
        category: "beds",
        label: "ICU Beds Available",
        value: "1",
        status: "Limited",
      },
      {
        category: "theatre",
        label: "Theatre 1",
        value: "Ready",
        status: "Ready",
      },
      {
        category: "theatre",
        label: "Theatre 2",
        value: "Occupied",
        status: "Busy",
      },
      {
        category: "blood",
        label: "O Negative",
        value: "Low Stock",
        status: "Low",
      },
      {
        category: "blood",
        label: "A Positive",
        value: "Available",
        status: "Available",
      },
      {
        category: "staff",
        label: "Triage Nurses On Duty",
        value: "3",
        status: "Active",
      },
      {
        category: "staff",
        label: "Emergency Doctors On Duty",
        value: "2",
        status: "Active",
      }
    ],
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