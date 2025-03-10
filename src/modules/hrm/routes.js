const express = require("express");
const router = express.Router();
const { auth, checkPermissions } = require("../../middleware/auth");

// Import controllers
const departmentController = require("./controllers/departmentController");
const positionController = require("./controllers/positionController");
const employeeController = require("./employee/employeeController");
const attendanceController = require("./attendance/attendance.controller");
const leaveController = require("./controllers/leaveController");

// Department routes
router.use("/departments", require("./routes/departmentRoutes"));

// Position routes
router.use("/positions", require("./routes/positionRoutes"));

// Employee routes
router.use("/employees", require("./employee/employeeRoutes"));

// Attendance routes
router.use("/attendance", require("./attendance/attendance.route"));

// Leave routes
router.use("/leaves", require("./routes/leaveRoutes"));

// Events routes
router.use("/events", require("./routes/events"));

module.exports = router;
