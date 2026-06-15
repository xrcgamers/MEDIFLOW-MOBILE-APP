const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role.name,
      staffId: user.staffId,
    },
    process.env.JWT_SECRET || "mediflow-dev-secret",
    {
      expiresIn: "7d",
    }
  );
}

exports.login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;

    const loginValue = (identifier || email || "").trim();

    if (!loginValue || !password) {
      return res.status(400).json({
        success: false,
        message: "Staff ID or email and password are required",
      });
    }

    const normalizedEmail = loginValue.toLowerCase();

    const user = await prisma.staffUser.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { staffId: loginValue },
        ],
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      await prisma.staffLoginEvent.create({
        data: {
          email: normalizedEmail.includes("@") ? normalizedEmail : null,
          staffId: normalizedEmail.includes("@") ? null : loginValue,
          wasSuccess: false,
          failureReason: "User not found",
        },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid staff ID/email or password",
      });
    }

    if (!user.isActive) {
      await prisma.staffLoginEvent.create({
        data: {
          userId: user.id,
          email: user.email,
          staffId: user.staffId,
          wasSuccess: false,
          failureReason: "Account inactive",
        },
      });

      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      await prisma.staffLoginEvent.create({
        data: {
          userId: user.id,
          email: user.email,
          staffId: user.staffId,
          wasSuccess: false,
          failureReason: "Invalid password",
        },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid staff ID/email or password",
      });
    }

    await prisma.staffLoginEvent.create({
      data: {
        userId: user.id,
        email: user.email,
        staffId: user.staffId,
        wasSuccess: true,
      },
    });

    const token = signToken(user);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          staffId: user.staffId,
          name: user.name,
          email: user.email,
          role: user.role.name,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.staffUser.findUnique({
      where: { id: req.user.id },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        staffId: user.staffId,
        name: user.name,
        email: user.email,
        role: user.role.name,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Fetch current user failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load current user",
      error: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  return res.json({
    success: true,
    message: "Logged out",
  });
};