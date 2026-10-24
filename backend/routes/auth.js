const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");
const { Resend } = require("resend");

const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      name.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          "Enter a valid name, email, and password of at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Account created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    console.error("Registration failed:", error.message);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("session", token, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    return res.status(500).json({
      message: "Login failed",
    });
  }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  const genericMessage =
    "If an account exists for that email, a reset link will be sent.";

  let user;

  try {
    const { email } = req.body;

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");

      return res.status(500).json({
        message: "Email service is not configured. Please try again later.",
      });
    }

    user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    // Do not reveal whether an account exists.
    if (!user) {
      return res.json({ message: genericMessage });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    user.resetTokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const clientUrl = process.env.CLIENT_URL?.replace(/\/+$/, "");

    if (!clientUrl) {
      throw new Error("CLIENT_URL is not configured");
    }

    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    const { error } = await resend.emails.send({
      // Replace this with an address on your verified Resend domain.
      from: "Student Manager <onboarding@resend.dev>",
      to: user.email,
      subject: "Reset your Student Manager password",
      text: `You requested a password reset. Open this link within 15 minutes: ${resetUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Student Manager</h2>
          <p>You requested to reset your password.</p>
          <p>
            <a href="${resetUrl}">Reset your password</a>
          </p>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend email failed:", error);

      throw new Error("Email delivery failed");
    }

    return res.json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password failed:", error.message);

    // Invalidate the token if processing or email delivery fails.
    if (user) {
      try {
        user.resetTokenHash = null;
        user.resetTokenExpiry = null;
        await user.save();
      } catch (cleanupError) {
        console.error("Reset-token cleanup failed");
      }
    }

    return res.status(500).json({
      message: "Unable to process your request right now",
    });
  }
});

// Reset password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Invalid token or password must be at least 8 characters",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Reset link is invalid or expired",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetTokenHash = null;
    user.resetTokenExpiry = null;

    await user.save();

    return res.json({
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    console.error("Password reset failed:", error.message);

    return res.status(500).json({
      message: "Password reset failed",
    });
  }
});

// Check the current session
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("_id name email");

    if (!user) {
      res.clearCookie("session", cookieOptions);

      return res.status(401).json({
        message: "User not found",
      });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Session check failed:", error.message);

    return res.status(500).json({
      message: "Unable to check session",
    });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("session", cookieOptions);

  return res.json({
    message: "Logged out successfully",
  });
});

module.exports = router;
