const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { createAuditLog } = require("../services/auditService");

exports.getAdminDashboard = async (req, res) => {
  try {
    const [
      totalIncidents,
      activeIncidents,
      totalPatients,
      pendingTriage,
      pendingResourceRequests,
      openAlerts,
      lowOrCriticalResources,
      staffUsers,
    ] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({
        where: {
          status: {
            in: ["RECEIVED", "UNDER_REVIEW", "ACCEPTED", "RESPONSE_IN_PROGRESS"],
          },
        },
      }),
      prisma.patient.count(),
      prisma.patient.count({
        where: {
          isExcluded: false,
          status: "UNTRIAGED",
        },
      }),
      prisma.resourceRequest.count({
        where: {
          requestStatus: {
            in: ["REQUESTED", "APPROVED", "PARTIALLY_ALLOCATED", "RESERVED", "IN_PROGRESS", "DELAYED"],
          },
        },
      }),
      prisma.systemAlert.count({
        where: {
          status: "OPEN",
        },
      }),
      prisma.resourceItem.count({
        where: {
          status: {
            in: ["LOW", "CRITICAL"],
          },
        },
      }),
      prisma.staffUser.count(),
    ]);

    return res.json({
      success: true,
      data: {
        summary: {
          totalIncidents,
          activeIncidents,
          totalPatients,
          pendingTriage,
          pendingResourceRequests,
          openAlerts,
          lowOrCriticalResources,
          staffUsers,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
      error: error.message,
    });
  }
};

exports.getStaffUsers = async (req, res) => {
  try {
    const users = await prisma.staffUser.findMany({
      include: {
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff users",
      error: error.message,
    });
  }
};

exports.getStaffRoles = async (req, res) => {
  try {
    const roles = await prisma.staffRole.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff roles",
      error: error.message,
    });
  }
};

exports.createStaffUser = async (req, res) => {
  try {
    const { staffId, name, email, password, roleId, isActive = true } = req.body;

    if (!staffId || !name || !email || !password || !roleId) {
      return res.status(400).json({
        success: false,
        message: "staffId, name, email, password and roleId are required",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.staffUser.create({
      data: {
        staffId,
        name,
        email,
        passwordHash,
        roleId,
        isActive,
      },
      include: {
        role: true,
      },
    });

    await createAuditLog({
      actionType: "STAFF_USER_CREATED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      targetTable: "StaffUser",
      targetId: created.id,
      newValue: {
        staffId: created.staffId,
        email: created.email,
        roleId: created.roleId,
        isActive: created.isActive,
      },
      reason: "Admin created staff user.",
    });

    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create staff user",
      error: error.message,
    });
  }
};

exports.updateStaffUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { staffId, name, email, password, roleId, isActive } = req.body;

    const existing = await prisma.staffUser.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Staff user not found",
      });
    }

    const data = {
      ...(staffId !== undefined ? { staffId } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(roleId !== undefined ? { roleId } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };

    if (password && password.trim()) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.staffUser.update({
      where: { id: userId },
      data,
      include: {
        role: true,
      },
    });

    await createAuditLog({
      actionType: "STAFF_USER_UPDATED",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      targetTable: "StaffUser",
      targetId: updated.id,
      oldValue: {
        staffId: existing.staffId,
        email: existing.email,
        roleId: existing.roleId,
        isActive: existing.isActive,
      },
      newValue: {
        staffId: updated.staffId,
        email: updated.email,
        roleId: updated.roleId,
        isActive: updated.isActive,
      },
      reason: "Admin updated staff user.",
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update staff user",
      error: error.message,
    });
  }
};

exports.resetStaffPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || !newPassword.trim()) {
      return res.status(400).json({
        success: false,
        message: "newPassword is required",
      });
    }

    const existing = await prisma.staffUser.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Staff user not found",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.staffUser.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });

    await createAuditLog({
      actionType: "STAFF_PASSWORD_RESET",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      targetTable: "StaffUser",
      targetId: userId,
      reason: "Admin reset staff password.",
    });

    return res.json({
      success: true,
      data: {
        userId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { actionType } = req.query;

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(actionType ? { actionType } : {}),
      },
      include: {
        actorUser: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
};