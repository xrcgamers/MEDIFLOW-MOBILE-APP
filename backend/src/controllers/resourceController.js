const prisma = require("../config/prisma");

exports.getResources = async (req, res) => {
  try {
    const items = await prisma.resourceItem.findMany({
      include: {
        actionLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: [
        { category: "asc" },
        { label: "asc" },
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

exports.addResourceAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType, note = "" } = req.body;

    if (!actionType) {
      return res.status(400).json({
        success: false,
        message: "Action type is required",
      });
    }

    const existing = await prisma.resourceItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Resource item not found",
      });
    }

    await prisma.resourceActionLog.create({
      data: {
        resourceId: id,
        actionType,
        note,
        actorName: req.user.name,
        actorUserId: req.user.id,
      },
    });

    const updatedResource = await prisma.resourceItem.findUnique({
      where: { id },
      include: {
        actionLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    res.json({
      success: true,
      data: updatedResource,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to record resource action",
      error: error.message,
    });
  }
};