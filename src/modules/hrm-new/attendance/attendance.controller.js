const Attendance = require("./attendance.model");
const Employee = require("../employee/employee.model");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const { createError } = require("../../../utils/errors");

// Get all attendance records
exports.getAllAttendance = catchAsync(async (req, res) => {
  const { startDate, endDate, employeeId, departmentId } = req.query;

  let query = { isDeleted: false };

  // Date range filter
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Employee filter
  if (employeeId) {
    query.employee = employeeId;
  }

  // Department filter
  if (departmentId) {
    const employees = await Employee.find({ department: departmentId }).select(
      "_id"
    );
    const employeeIds = employees.map((emp) => emp._id);
    query.employee = { $in: employeeIds };
  }

  const attendance = await Attendance.find(query)
    .populate({
      path: "employee",
      select: "firstName lastName employeeId department position",
      populate: [
        { path: "department", select: "name" },
        { path: "position", select: "name" },
      ],
    })
    .sort({ date: -1, "checkIn.time": -1 });

  res.status(200).json({
    status: "success",
    results: attendance.length,
    data: {
      attendance,
    },
  });
});

// Get a single attendance record
exports.getAttendance = catchAsync(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id).populate({
    path: "employee",
    select: "firstName lastName employeeId department position",
    populate: [
      { path: "department", select: "name" },
      { path: "position", select: "name" },
    ],
  });

  if (!attendance) {
    return next(new AppError("No attendance record found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      attendance,
    },
  });
});

// Create a new attendance record
exports.createAttendance = catchAsync(async (req, res, next) => {
  // Check if employee exists
  const employee = await Employee.findById(req.body.employee);
  if (!employee) {
    return next(new AppError("No employee found with that ID", 404));
  }

  // Create attendance record
  const newAttendance = await Attendance.create({
    ...req.body,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      attendance: newAttendance,
    },
  });
});

// Update an attendance record
exports.updateAttendance = catchAsync(async (req, res, next) => {
  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!attendance) {
    return next(new AppError("No attendance record found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      attendance,
    },
  });
});

// Delete an attendance record
exports.deleteAttendance = catchAsync(async (req, res, next) => {
  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, updatedBy: req.user._id },
    { new: true }
  );

  if (!attendance) {
    return next(new AppError("No attendance record found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: null,
  });
});

// Get attendance for the logged-in employee
exports.getEmployeeAttendance = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  // Find the employee associated with the logged-in user
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new AppError("No employee profile found for this user", 404));
  }

  let query = {
    employee: employee._id,
    isDeleted: false,
  };

  // Date range filter
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const attendance = await Attendance.find(query).sort({ date: -1 });

  res.status(200).json({
    status: "success",
    results: attendance.length,
    data: {
      attendance,
    },
  });
});

// Get attendance by employee ID
exports.getAttendanceByEmployeeId = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const { employeeId } = req.params;

  // Check if employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return next(new AppError("No employee found with that ID", 404));
  }

  let query = {
    employee: employeeId,
    isDeleted: false,
  };

  // Date range filter
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const attendance = await Attendance.find(query).sort({ date: -1 });

  res.status(200).json({
    status: "success",
    results: attendance.length,
    data: {
      attendance,
    },
  });
});

// Check out an employee
exports.checkOut = catchAsync(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return next(new AppError("No attendance record found with that ID", 404));
  }

  if (!attendance.checkIn) {
    return next(
      new AppError("Cannot check out without checking in first", 400)
    );
  }

  if (attendance.checkOut && attendance.checkOut.time) {
    return next(new AppError("Employee has already checked out", 400));
  }

  // Update with checkout information
  attendance.checkOut = {
    time: new Date(),
    device: req.body.device || "Web",
    ipAddress: req.ip,
  };

  // Calculate work hours
  const checkInTime = new Date(attendance.checkIn.time);
  const checkOutTime = new Date(attendance.checkOut.time);
  attendance.workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

  // Round to 2 decimal places
  attendance.workHours = Math.round(attendance.workHours * 100) / 100;

  // Update status based on work hours
  attendance.status = determineStatus(
    checkInTime,
    checkOutTime,
    attendance.workHours
  );

  // Save the updated attendance record
  await attendance.save();

  res.status(200).json({
    status: "success",
    data: {
      attendance,
    },
  });
});

// Create bulk attendance records
exports.createBulkAttendance = catchAsync(async (req, res, next) => {
  const { attendanceRecords } = req.body;

  if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
    return next(
      new AppError("Please provide an array of attendance records", 400)
    );
  }

  // Add created by and updated by to each record
  const recordsWithUser = attendanceRecords.map((record) => ({
    ...record,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  }));

  const attendance = await Attendance.insertMany(recordsWithUser);

  res.status(201).json({
    status: "success",
    results: attendance.length,
    data: {
      attendance,
    },
  });
});

// Get attendance statistics
exports.getAttendanceStats = catchAsync(async (req, res) => {
  const { startDate, endDate, departmentId } = req.query;

  if (!startDate || !endDate) {
    return next(new AppError("Please provide start and end dates", 400));
  }

  let matchStage = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
    isDeleted: false,
  };

  // Department filter
  if (departmentId) {
    const employees = await Employee.find({ department: departmentId }).select(
      "_id"
    );
    const employeeIds = employees.map((emp) => emp._id);
    matchStage.employee = { $in: employeeIds };
  }

  const stats = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
      },
    },
  ]);

  // Calculate total attendance
  const total = stats.reduce((acc, curr) => acc + curr.count, 0);

  res.status(200).json({
    status: "success",
    data: {
      stats,
      total,
    },
  });
});

// Helper function to determine attendance status
const determineStatus = (checkInTime, checkOutTime, workHours) => {
  // This is a simplified version - you may want to add more complex logic
  if (workHours >= 8) {
    return "Present";
  } else if (workHours >= 4) {
    return "Half-Day";
  } else if (workHours > 0) {
    return "Early-Leave";
  } else {
    return "Absent";
  }
};
