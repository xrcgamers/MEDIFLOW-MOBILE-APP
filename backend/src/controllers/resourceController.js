const prisma = require("../config/prisma");

exports.getResources = async (req, res) => {
  try {
    const items = await prisma.resourceItem.findMany({
      orderBy: [
        { category: "asc" },
        { createdAt: "desc" },
      ],
    });

    const grouped = {
      beds: items.filter((item) => item.category === "beds"),
      theatre: items.filter((item) => item.category === "theatre"),
      blood: items.filter((item) => item.category === "blood"),
      staff: items.filter((item) => item.category === "staff"),
    };

    res.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch resources",
      error: error.message,
    });
  }
};