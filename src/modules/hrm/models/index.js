// Import all models
const Employee = require("./Employee");
const Department = require("./Department");
const Attendance = require("../attendance/attendance.model");
const Position = require("./Position");
const Leave = require("./Leave");

// Export models
module.exports = {
  Employee,
  Department,
  Attendance,
  Position,
  Leave,
};
