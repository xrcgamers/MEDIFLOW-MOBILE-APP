const prisma = require("../config/prisma");

exports.getTriageQueue = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: {
        isExcluded: false,
        status: {
          in: ["UNTRIAGED", "TRIAGED"],
        },
        incident: {
          status: "ACCEPTED",
        },
      },
      include: {
        incident: {
          include: {
            mediaAttachments: true,
            aiAssessment: true,
            queuePriority: true,
          },
        },
        triages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        resourceRequests: {
          include: {
            resourceCategory: true,
            primaryResourceItem: true,
            allocations: {
              include: {
                resourceItem: true,
              },
            },
          },
          orderBy: {
            requestedAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load triage queue",
      error: error.message,
    });
  }
};