const Leave = require("./leave.model");
const Employee = require("../employee/employee.model");
const Attendance = require("../attendance/attendance.model");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");

// Get all leave requests
exports.getAllLeaves = catchAsync(async (req, res) => {
  const { status, employeeId, departmentId, startDate, endDate, userId } =
    req.query;

  let query = { isDeleted: false };

  // If user is not admin/manager, only show their own leaves
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    query.employee = req.user._id;
  } else {
    // Status filter
    if (status) {
      query.status = status;
    }

    // Employee filter
    if (employeeId) {
      query.employee = employeeId;
    }

    // Department filter
    if (departmentId) {
      const employees = await Employee.find({
        department: departmentId,
      }).select("_id");
      const employeeIds = employees.map((emp) => emp._id);
      query.employee = { $in: employeeIds };
    }

    // User filter
    if (userId) {
      const employee = await Employee.findOne({ user: userId }).select("_id");
      if (employee) {
        query.employee = employee._id;
      }
    }
  }

  // Date range filter
  if (startDate && endDate) {
    query.$or = [
      {
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      },
      {
        endDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
      },
      {
        $and: [
          { startDate: { $lte: new Date(startDate) } },
          { endDate: { $gte: new Date(endDate) } },
        ],
      },
    ];
  }

  const leaves = await Leave.find(query)
    .populate({
      path: "employee",
      select: "firstName lastName employeeId department position",
      populate: [
        { path: "department", select: "name" },
        { path: "position", select: "name" },
      ],
    })
    .populate({
      path: "approvedBy",
      select: "firstName lastName employeeId",
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: leaves.length,
    data: {
      leaves,
    },
  });
});

// Get a single leave request
exports.getLeave = catchAsync(async (req, res, next) => {
  const leave = await Leave.findById(req.params.id)
    .populate({
      path: "employee",
      select: "firstName lastName employeeId department position",
      populate: [
        { path: "department", select: "name" },
        { path: "position", select: "name" },
      ],
    })
    .populate({
      path: "approvedBy",
      select: "firstName lastName employeeId",
    })
    .populate({
      path: "comments.user",
      select: "firstName lastName",
    });

  if (!leave) {
    return next(new AppError("No leave request found with that ID", 404));
  }

  // Check if user has permission to view this leave
  if (
    req.user.role !== "admin" &&
    req.user.role !== "manager" &&
    leave.employee._id.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError("You do not have permission to view this leave request", 403)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      leave,
    },
  });
});

// Create a new leave request
exports.createLeave = catchAsync(async (req, res, next) => {
  // If employee ID is not provided, find the employee associated with the logged-in user
  if (!req.body.employee) {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return next(new AppError("No employee profile found for this user", 404));
    }
    req.body.employee = employee._id;
  }

  // Create leave request
  const newLeave = await Leave.create({
    ...req.body,
    user: req.user._id,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      leave: newLeave,
    },
  });
});

// Update a leave request
exports.updateLeave = catchAsync(async (req, res, next) => {
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    return next(new AppError("No leave request found with that ID", 404));
  }

  // Only allow updates if leave is pending
  if (leave.status !== "Pending") {
    return next(
      new AppError("Cannot update leave request that has been processed", 400)
    );
  }

  // Update leave request
  const updatedLeave = await Leave.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      leave: updatedLeave,
    },
  });
});

// Delete a leave request
exports.deleteLeave = catchAsync(async (req, res, next) => {
  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    return next(new AppError("No leave request found with that ID", 404));
  }

  // Only allow deletion if leave is pending
  if (leave.status !== "Pending") {
    return next(
      new AppError("Cannot delete leave request that has been processed", 400)
    );
  }

  // Soft delete
  await Leave.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, updatedBy: req.user._id },
    { new: true }
  );

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Review a leave request (approve/reject)
exports.reviewLeave = catchAsync(async (req, res, next) => {
  const { status, rejectionReason, comment } = req.body;

  if (!status || !["Approved", "Rejected"].includes(status)) {
    return next(
      new AppError("Please provide a valid status (Approved or Rejected)", 400)
    );
  }

  // If rejecting, require a reason
  if (status === "Rejected" && !rejectionReason) {
    return next(new AppError("Please provide a reason for rejection", 400));
  }

  const leave = await Leave.findById(req.params.id);

  if (!leave) {
    return next(new AppError("No leave request found with that ID", 404));
  }

  // Only allow review if leave is pending
  if (leave.status !== "Pending") {
    return next(
      new AppError(
        "Cannot review leave request that has already been processed",
        400
      )
    );
  }

  // Find the employee record for the approver
  const approverEmployee = await Employee.findOne({ user: req.user._id });

  if (!approverEmployee) {
    return next(new AppError("Approver employee record not found", 404));
  }

  // Update leave status
  const updateData = {
    status,
    approvedBy: approverEmployee._id,
    approvalDate: new Date(),
    updatedBy: req.user._id,
  };

  if (status === "Rejected") {
    updateData.rejectionReason = rejectionReason;
  }

  // Add comment if provided
  if (comment) {
    updateData.$push = {
      comments: {
        user: req.user._id,
        text: comment,
      },
    };
  }

  const updatedLeave = await Leave.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  // If approved, create attendance records for the leave period
  if (status === "Approved") {
    await createAttendanceRecordsForLeave(updatedLeave, req.user._id);
  }

  res.status(200).json({
    status: "success",
    data: {
      leave: updatedLeave,
    },
  });
});

// Get leave statistics
exports.getLeaveStats = catchAsync(async (req, res) => {
  const { year, departmentId } = req.query;

  // Default to current year if not specified
  const selectedYear = year || new Date().getFullYear();
  const startDate = new Date(`${selectedYear}-01-01`);
  const endDate = new Date(`${selectedYear}-12-31`);

  let matchStage = {
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
    ],
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

  // Get leave statistics by type and status
  const stats = await Leave.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          leaveType: "$leaveType",
          status: "$status",
        },
        count: { $sum: 1 },
        totalDays: { $sum: "$duration" },
      },
    },
    {
      $group: {
        _id: "$_id.leaveType",
        statusCounts: {
          $push: {
            status: "$_id.status",
            count: "$count",
            totalDays: "$totalDays",
          },
        },
        totalCount: { $sum: "$count" },
        totalDays: { $sum: "$totalDays" },
      },
    },
    {
      $project: {
        _id: 0,
        leaveType: "$_id",
        statusCounts: 1,
        totalCount: 1,
        totalDays: 1,
      },
    },
    { $sort: { totalCount: -1 } },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      year: selectedYear,
      stats,
    },
  });
});

// Helper function to create attendance records for approved leave
async function createAttendanceRecordsForLeave(leave, userId) {
  try {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);

    // Set time to midnight to count full days
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    // Create an attendance record for each day of the leave
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Skip weekends (Saturday and Sunday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Check if an attendance record already exists for this day
        const existingAttendance = await Attendance.findOne({
          employee: leave.employee,
          date: new Date(currentDate),
          isDeleted: false,
        });

        if (!existingAttendance) {
          // Create a new attendance record
          await Attendance.create({
            employee: leave.employee,
            date: new Date(currentDate),
            status: "On-Leave",
            isLeave: true,
            leaveType: leave.leaveType,
            leaveId: leave._id,
            shift: "Morning", // Default shift
            createdBy: userId,
            updatedBy: userId,
          });
        } else {
          // Update existing attendance record
          await Attendance.findByIdAndUpdate(existingAttendance._id, {
            status: "On-Leave",
            isLeave: true,
            leaveType: leave.leaveType,
            leaveId: leave._id,
            updatedBy: userId,
          });
        }
      }

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } catch (error) {
    console.error("Error creating attendance records for leave:", error);
  }
}
