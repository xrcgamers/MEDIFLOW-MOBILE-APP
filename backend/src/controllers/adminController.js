const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { createAuditLog } = require("../services/auditService");

function normalizeBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === "true";
}

async function findRoleId({ roleId, roleName }) {
  if (roleId) return roleId;

  if (!roleName) return null;

  const role = await prisma.staffRole.findUnique({
    where: { name: roleName },
  });

  return role?.id || null;
}

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

      prisma.patient.count({
        where: {
          isExcluded: false,
        },
      }),

      prisma.patient.count({
        where: {
          isExcluded: false,
          status: "UNTRIAGED",
        },
      }),

      prisma.resourceRequest.count({
        where: {
          requestStatus: {
            in: [
              "REQUESTED",
              "APPROVED",
              "PARTIALLY_ALLOCATED",
              "RESERVED",
              "IN_PROGRESS",
              "DELAYED",
            ],
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

      prisma.staffUser.count({
        where: {
          isActive: true,
        },
      }),
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

          // aliases for frontend compatibility
          openIncidents: activeIncidents,
          acceptedIncidents: activeIncidents,
          patients: totalPatients,
          untriagedPatients: pendingTriage,
          lowStockResources: lowOrCriticalResources,
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
    const {
      staffId,
      name,
      email,
      password,
      roleId,
      roleName,
      isActive = true,
    } = req.body;

    if (!staffId || !name || !email || !password || (!roleId && !roleName)) {
      return res.status(400).json({
        success: false,
        message: "staffId, name, email, password and role are required",
      });
    }

    const resolvedRoleId = await findRoleId({ roleId, roleName });

    if (!resolvedRoleId) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff role",
      });
    }

    const existing = await prisma.staffUser.findFirst({
      where: {
        OR: [{ email }, { staffId }],
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A staff user with this email or staff ID already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.staffUser.create({
      data: {
        staffId: staffId.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        roleId: resolvedRoleId,
        isActive: normalizeBoolean(isActive, true),
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
    const {
      staffId,
      name,
      email,
      password,
      roleId,
      roleName,
      isActive,
    } = req.body;

    const existing = await prisma.staffUser.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Staff user not found",
      });
    }

    let resolvedRoleId;

    if (roleId || roleName) {
      resolvedRoleId = await findRoleId({ roleId, roleName });

      if (!resolvedRoleId) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff role",
        });
      }
    }

    const data = {
      ...(staffId !== undefined ? { staffId: staffId.trim() } : {}),
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
      ...(resolvedRoleId !== undefined ? { roleId: resolvedRoleId } : {}),
      ...(isActive !== undefined
        ? { isActive: normalizeBoolean(isActive, existing.isActive) }
        : {}),
    };

    if (password && password.trim()) {
      data.passwordHash = await bcrypt.hash(password.trim(), 10);
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

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);

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

exports.deleteStaffUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user?.id === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account while logged in",
      });
    }

    const existing = await prisma.staffUser.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Staff user not found",
      });
    }

    try {
      await prisma.staffUser.delete({
        where: { id: userId },
      });

      await createAuditLog({
        actionType: "STAFF_USER_DELETED",
        actorUserId: req.user?.id || null,
        actorRole: req.user?.role || null,
        targetTable: "StaffUser",
        targetId: userId,
        oldValue: {
          staffId: existing.staffId,
          email: existing.email,
          role: existing.role?.name,
        },
        reason: "Admin deleted staff user.",
      });

      return res.json({
        success: true,
        data: {
          userId,
          deleted: true,
        },
      });
    } catch (deleteError) {
      const deactivated = await prisma.staffUser.update({
        where: { id: userId },
        data: {
          isActive: false,
        },
        include: {
          role: true,
        },
      });

      await createAuditLog({
        actionType: "STAFF_USER_DEACTIVATED_AFTER_DELETE_FAILED",
        actorUserId: req.user?.id || null,
        actorRole: req.user?.role || null,
        targetTable: "StaffUser",
        targetId: userId,
        reason:
          "Physical delete failed because user has related records. User was deactivated instead.",
      });

      return res.json({
        success: true,
        data: {
          ...deactivated,
          deleted: false,
          deactivated: true,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete staff user",
      error: error.message,
    });
  }
};

exports.assignIncidentToEmergencyNurse = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { emergencyNurseId } = req.body;

    const nurse = await prisma.staffUser.findUnique({
      where: { id: emergencyNurseId },
      include: { role: true },
    });

    if (!nurse || nurse.role?.name !== "EMERGENCY_NURSE") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not an emergency nurse",
      });
    }

    const updated = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        assignedEmergencyNurseId: emergencyNurseId,
      },
      include: {
        assignedEmergencyNurse: true,
      },
    });

    await createAuditLog({
      actionType: "INCIDENT_ASSIGNED_TO_EMERGENCY_NURSE",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      incidentId,
      targetTable: "Incident",
      targetId: incidentId,
      newValue: {
        assignedEmergencyNurseId: emergencyNurseId,
      },
      reason: "Admin assigned incident to emergency nurse.",
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to assign incident",
      error: error.message,
    });
  }
};

exports.assignPatientToTriageNurse = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { triageNurseId } = req.body;

    const nurse = await prisma.staffUser.findUnique({
      where: { id: triageNurseId },
      include: { role: true },
    });

    if (!nurse || nurse.role?.name !== "TRIAGE_NURSE") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a triage nurse",
      });
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        assignedTriageNurseId: triageNurseId,
      },
      include: {
        assignedTriageNurse: true,
      },
    });

    await createAuditLog({
      actionType: "PATIENT_ASSIGNED_TO_TRIAGE_NURSE",
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || null,
      patientId,
      targetTable: "Patient",
      targetId: patientId,
      newValue: {
        assignedTriageNurseId: triageNurseId,
      },
      reason: "Admin assigned patient to triage nurse.",
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to assign patient",
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