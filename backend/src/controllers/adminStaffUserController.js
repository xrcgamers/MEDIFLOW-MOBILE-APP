const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

async function ensureRole(roleName) {
  let role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: roleName,
        description: `${roleName} role`,
      },
    });
  }

  return role;
}

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
      message: "Failed to load staff users",
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
      roleName,
    } = req.body;

    if (!staffId || !name || !email || !password || !roleName) {
      return res.status(400).json({
        success: false,
        message: "staffId, name, email, password and roleName are required",
      });
    }

    const existing = await prisma.staffUser.findFirst({
      where: {
        OR: [{ staffId }, { email }],
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A staff user with this staff ID or email already exists",
      });
    }

    const role = await ensureRole(roleName);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.staffUser.create({
      data: {
        staffId,
        name,
        email,
        passwordHash,
        roleId: role.id,
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create staff user",
      error: error.message,
    });
  }
};