const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const Student = require("./models/Student");
const authRoutes = require("./routes/auth");
const cookieParser = require("cookie-parser");
const requireAuth = require("./middleware/requireAuth");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

function handleStudentError(error, res) {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "This email is already registered",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(error.errors)
        .map((item) => item.message)
        .join(", "),
    });
  }

  return res.status(500).json({
    message: "Something went wrong on the server",
  });
}

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error(error));

// Test route
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// Get all students
app.get("/api/students", requireAuth, async (req, res) => {
  try {
    const students = await Student.find({
      owner: req.userId,
    });

    res.json(students);
  } catch {
    res.status(500).json({
      message: "Failed to fetch students",
    });
  }
});

// Add a student
app.post("/api/students", requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const student = await Student.create({
      name: name.trim(),
      email: email.trim(),
      owner: req.userId,
    });

    res.status(201).json(student);
  } catch (error) {
    return handleStudentError(error, res);
  }
});

// Delete a student
app.delete("/api/students/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    const student = await Student.findOneAndDelete({
      _id: id,
      owner: req.userId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json({
      message: "Student deleted successfully",
      id: student._id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete student",
    });
  }
});

// Update a student
app.put("/api/students/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      !name.trim() ||
      !email.trim()
    ) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const student = await Student.findOneAndUpdate(
      { _id: id, owner: req.userId },
      { name: name.trim(), email: email.trim() },
      { new: true, runValidators: true },
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json(student);
  } catch (error) {
    return handleStudentError(error, res);
  }
});

// Get one student by ID
app.get("/api/students/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    const student = await Student.findOne({
      _id: id,
      owner: req.userId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch student",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
