const express = require("express");
const router = express.Router();

// Import submodule routes
const attendanceRoutes = require("./attendance/attendance.route");
const leaveRoutes = require("./leave/leave.route");
const employeeRoutes = require("./employee/employee.route");
const departmentRoutes = require("./department/department.route");
const positionRoutes = require("./position/position.route");
const payrollRoutes = require("./payroll/payroll.route");

// Mount submodule routes
router.use("/attendance", attendanceRoutes);
router.use("/leave", leaveRoutes);
router.use("/employee", employeeRoutes);
router.use("/department", departmentRoutes);
router.use("/position", positionRoutes);
router.use("/payroll", payrollRoutes);

module.exports = router;
