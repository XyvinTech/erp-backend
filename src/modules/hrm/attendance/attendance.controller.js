const Attendance = require('./attendance.model');
const Employee = require('../employee/employee.model');
const catchAsync = require('../../../utils/catchAsync');
const { createError } = require('../../../utils/errors');

// Get all attendance records
exports.getAllAttendance = catchAsync(async (req, res) => {
  const { startDate, endDate, employeeId, departmentId } = req.query;
  
  let query = { isDeleted: false };
  
  // Date range filter
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  // Employee filter
  if (employeeId) {
    query.employee = employeeId;
  }
  
  // Department filter
  if (departmentId) {
    const employees = await Employee.find({ department: departmentId }).select('_id');
    query.employee = { $in: employees.map(emp => emp._id) };
  }

  const attendance = await Attendance.find(query)
    .populate({
      path: 'employee',
      select: 'firstName lastName department position',
      populate: [
        { path: 'department', select: 'name' },
        { path: 'position', select: 'title' }
      ]
    })
    .sort('-date');

  res.status(200).json({
    status: 'success',
    results: attendance.length,
    data: { attendance }
  });
});

// Get single attendance record
exports.getAttendance = catchAsync(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id)
    .populate({
      path: 'employee',
      select: 'firstName lastName department position',
      populate: [
        { path: 'department', select: 'name' },
        { path: 'position', select: 'title' }
      ]
    });

  if (!attendance) {
    throw createError(404, 'No attendance record found with that ID');
  }

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Create attendance record
exports.createAttendance = catchAsync(async (req, res) => {
  const { employee, date, checkIn, status, notes, shift = 'Morning' } = req.body;

  // Check for existing attendance record
  const existingAttendance = await Attendance.findOne({
    employee,
    date: new Date(date)
  });

  if (existingAttendance) {
    throw createError(400, 'Attendance record already exists for this date');
  }

  // Create attendance with check-in only
  const attendance = await Attendance.create({
    employee,
    date: new Date(date),
    checkIn: {
      time: checkIn?.time || new Date(),
      device: checkIn?.device || 'Web',
      ipAddress: checkIn?.ipAddress
    },
    status: status || 'Present',
    notes,
    shift,
    workHours: 0 // Initialize work hours as 0
  });

  const populatedAttendance = await Attendance.findById(attendance._id)
    .populate({
      path: 'employee',
      select: 'firstName lastName department position',
      populate: [
        { path: 'department', select: 'name' },
        { path: 'position', select: 'title' }
      ]
    });

  res.status(201).json({
    status: 'success',
    data: { attendance: populatedAttendance }
  });
});

// Create bulk attendance records
exports.createBulkAttendance = catchAsync(async (req, res) => {
  const attendanceRecords = req.body;

  // Validate input
  if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
    throw createError(400, 'Please provide an array of attendance records');
  }

  // Validate each record has required fields and proper date format
  attendanceRecords.forEach((record, index) => {
    if (!record.employee) {
      throw createError(400, `Employee ID is required for record at index ${index}`);
    }
    if (!record.date) {
      throw createError(400, `Date is required for record at index ${index}`);
    }
    
    // Validate date format
    const date = new Date(record.date);
    if (isNaN(date.getTime())) {
      throw createError(400, `Invalid date format for record at index ${index}`);
    }
  });

  const employeeIds = [...new Set(attendanceRecords.map(record => record.employee))];

  if (employeeIds.length === 0) {
    throw createError(400, 'No valid employee IDs provided');
  }

  // Check if employees exist and are active
  const employees = await Employee.find({
    _id: { $in: employeeIds }
  }).select('_id status');

  if (employees.length !== employeeIds.length) {
    throw createError(400, 'One or more employees not found');
  }

  // Verify all employees are active
  const inactiveEmployees = employees.filter(emp => emp.status !== 'active');
  if (inactiveEmployees.length > 0) {
    throw createError(400, `Found ${inactiveEmployees.length} inactive employee(s)`);
  }

  const results = [];
  const errors = [];

  // Process each attendance record
  for (const record of attendanceRecords) {
    try {
      // Parse and validate date
      const attendanceDate = new Date(record.date);
      attendanceDate.setHours(0, 0, 0, 0);

      // Find existing attendance for the day
      const existingAttendance = await Attendance.findOne({
        employee: record.employee,
        date: attendanceDate
      });

      if (existingAttendance) {
        // If checkout data is provided and not a holiday/on-leave, update existing record
        if (record.checkOut && !['Holiday', 'On-Leave'].includes(record.status)) {
          const checkInTime = existingAttendance.checkIn?.time;
          const checkOutTime = new Date(record.checkOut.time || new Date());
          
          // Calculate work hours
          const workHours = calculateWorkHours(checkInTime, checkOutTime);
          
          const updatedAttendance = await Attendance.findByIdAndUpdate(
            existingAttendance._id,
            {
              $set: {
                checkOut: {
                  time: checkOutTime,
                  device: record.checkOut.device || 'Web',
                  ipAddress: record.checkOut.ipAddress
                },
                workHours,
                status: determineStatus(checkInTime, checkOutTime, workHours),
                updatedBy: req.user._id
              }
            },
            { new: true }
          ).populate({
            path: 'employee',
            select: 'firstName lastName department position',
            populate: [
              { path: 'department', select: 'name' },
              { path: 'position', select: 'title' }
            ]
          });
          
          results.push(updatedAttendance);
          continue;
        }
      }

      // Create new attendance record if no existing record or no checkout data
      const attendanceData = {
        employee: record.employee,
        date: attendanceDate,
        status: record.status || 'Present',
        notes: record.notes,
        shift: record.shift || 'Morning',
        workHours: 0,
        createdBy: req.user._id,
        updatedBy: req.user._id
      };

      // Handle check-in data based on status
      if (!['Holiday', 'On-Leave'].includes(record.status)) {
        const checkInTime = record.checkIn?.time ? new Date(record.checkIn.time) : new Date();
        if (isNaN(checkInTime.getTime())) {
          throw createError(400, 'Invalid check-in time format');
        }

        attendanceData.checkIn = {
          time: checkInTime,
          device: record.checkIn?.device || 'Web',
          ipAddress: record.checkIn?.ipAddress
        };
      } else {
        // For holiday/on-leave status, set special flags
        attendanceData.isHoliday = record.status === 'Holiday';
        attendanceData.notes = record.notes || `Not checked in - ${record.status}`;
      }

      const newAttendance = await Attendance.create(attendanceData);

      const populatedAttendance = await Attendance.findById(newAttendance._id)
        .populate({
          path: 'employee',
          select: 'firstName lastName department position',
          populate: [
            { path: 'department', select: 'name' },
            { path: 'position', select: 'title' }
          ]
        });

      results.push(populatedAttendance);
    } catch (error) {
      console.error(`Error processing record for employee ${record.employee}:`, error);
      errors.push({
        employee: record.employee,
        date: record.date,
        error: error.message
      });
      continue;
    }
  }

  res.status(201).json({
    status: 'success',
    results: results.length,
    data: { 
      attendance: results,
      errors: errors.length > 0 ? errors : undefined
    }
  });
});

// Helper function to calculate work hours
const calculateWorkHours = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) return 0;
  
  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);
  
  // Validate dates
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return 0;
  }
  
  // Ensure checkOut is after checkIn
  if (checkOut <= checkIn) {
    return 0;
  }
  
  const diffInHours = (checkOut - checkIn) / (1000 * 60 * 60); // Convert milliseconds to hours
  return Math.max(0, Math.round(diffInHours * 100) / 100); // Round to 2 decimal places, ensure non-negative
};

// Update attendance for checkout
exports.checkOut = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { checkOut } = req.body;

  // Find the attendance record
  const attendance = await Attendance.findById(id);

  if (!attendance) {
    throw createError(404, 'No attendance record found with that ID');
  }

  if (!attendance.checkIn || !attendance.checkIn.time) {
    throw createError(400, 'Cannot checkout without a check-in record');
  }

  if (attendance.checkOut && attendance.checkOut.time) {
    throw createError(400, 'Employee has already checked out');
  }

  const checkInTime = new Date(attendance.checkIn.time);
  const checkOutTime = new Date(checkOut?.time || new Date());

  // Validate checkout time is after checkin
  if (checkOutTime <= checkInTime) {
    throw createError(400, 'Check-out time must be after check-in time');
  }

  // Calculate work hours
  const workHours = calculateWorkHours(checkInTime, checkOutTime);

  // Update the attendance record with checkout and work hours
  const updatedAttendance = await Attendance.findByIdAndUpdate(
    id,
    {
      $set: {
        checkOut: {
          time: checkOutTime,
          device: checkOut?.device || 'Web',
          ipAddress: checkOut?.ipAddress
        },
        workHours,
        status: determineStatus(checkInTime, checkOutTime, workHours)
      }
    },
    {
      new: true,
      runValidators: true
    }
  ).populate({
    path: 'employee',
    select: 'firstName lastName department position',
    populate: [
      { path: 'department', select: 'name' },
      { path: 'position', select: 'title' }
    ]
  });

  res.status(200).json({
    status: 'success',
    data: { attendance: updatedAttendance }
  });
});

// Helper function to determine attendance status
const determineStatus = (checkInTime, checkOutTime, workHours) => {
  // You can customize these thresholds based on your requirements
  const fullDayHours = 8; // Standard work hours for a full day
  const halfDayHours = 4; // Standard work hours for a half day
  
  if (workHours >= fullDayHours) {
    return 'Present';
  } else if (workHours >= halfDayHours) {
    return 'Half-Day';
  } else if (workHours > 0) {
    return 'Early-Leave';
  } else {
    return 'Absent';
  }
};

// Delete attendance record (Soft Delete)
exports.deleteAttendance = catchAsync(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    throw createError(404, 'No attendance record found with that ID');
  }

  // Implement soft delete
  attendance.isDeleted = true;
  await attendance.save();

  res.status(200).json({
    status: 'success',
    message: 'Attendance record deleted successfully'
  });
});

// Get attendance statistics
exports.getAttendanceStats = catchAsync(async (req, res) => {
  const { startDate, endDate, departmentId } = req.query;

  // Get total active employees count
  let employeeQuery = { status: 'active' };
  if (departmentId) {
    employeeQuery.department = departmentId;
  }
  const totalEmployees = await Employee.countDocuments(employeeQuery);

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get attendance stats for today
  let todayMatchStage = { 
    isDeleted: false,
    date: {
      $gte: today,
      $lt: tomorrow
    }
  };

  if (departmentId) {
    const employees = await Employee.find({ department: departmentId }).select('_id');
    todayMatchStage.employee = { $in: employees.map(emp => emp._id) };
  }

  const todayStats = await Attendance.aggregate([
    {
      $match: todayMatchStage
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        uniqueEmployees: { $addToSet: '$employee' }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        uniqueEmployeeCount: { $size: '$uniqueEmployees' }
      }
    }
  ]);

  // Get attendance stats for the period (if date range provided)
  let periodMatchStage = { isDeleted: false };
  if (startDate && endDate) {
    periodMatchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (departmentId) {
    const employees = await Employee.find({ department: departmentId }).select('_id');
    periodMatchStage.employee = { $in: employees.map(emp => emp._id) };
  }

  const periodStats = await Attendance.aggregate([
    {
      $match: periodMatchStage
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        uniqueEmployees: { $addToSet: '$employee' }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        uniqueEmployeeCount: { $size: '$uniqueEmployees' }
      }
    }
  ]);

  // Get previous month's stats for comparison
  const prevMonthStart = new Date(startDate);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  const prevMonthEnd = new Date(endDate);
  prevMonthEnd.setMonth(prevMonthEnd.getMonth() - 1);

  let prevMonthMatchStage = { ...periodMatchStage };
  if (startDate && endDate) {
    prevMonthMatchStage.date = {
      $gte: prevMonthStart,
      $lte: prevMonthEnd
    };
  }

  const prevMonthStats = await Attendance.aggregate([
    {
      $match: prevMonthMatchStage
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Calculate percentage changes
  const calculateChange = (currentCount, prevCount) => {
    if (prevCount === 0) return currentCount > 0 ? '+100%' : '0%';
    const change = ((currentCount - prevCount) / prevCount) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  // Get previous month's employee count
  const prevMonthEmployeeQuery = { ...employeeQuery, createdAt: { $lte: prevMonthEnd } };
  const prevMonthTotalEmployees = await Employee.countDocuments(prevMonthEmployeeQuery);

  // Calculate total present employees today (including Present, Late, and Early-Leave)
  const presentStatuses = ['Present', 'Late', 'Early-Leave'];
  const todayPresentCount = todayStats
    .filter(stat => presentStatuses.includes(stat._id))
    .reduce((sum, stat) => sum + stat.uniqueEmployeeCount, 0);

  const todayHalfDayCount = todayStats
    .find(stat => stat._id === 'Half-Day')?.uniqueEmployeeCount || 0;

  const todayLeaveCount = todayStats
    .find(stat => stat._id === 'On-Leave')?.uniqueEmployeeCount || 0;

  res.status(200).json({
    status: 'success',
    data: { 
      stats: periodStats,
      totalEmployees,
      todayStats: {
        presentToday: presentStatuses,
        halfDay: todayHalfDayCount,
        onLeave: todayLeaveCount
      },
      changes: {
        employees: calculateChange(totalEmployees, prevMonthTotalEmployees),
        present: calculateChange(
          presentStatuses,
          prevMonthStats.filter(s => presentStatuses.includes(s._id))
            .reduce((sum, stat) => sum + stat.count, 0)
        ),
        halfDay: calculateChange(
          todayHalfDayCount,
          prevMonthStats.find(s => s._id === 'Half-Day')?.count || 0
        ),
        leave: calculateChange(
          todayLeaveCount,
          prevMonthStats.find(s => s._id === 'On-Leave')?.count || 0
        )
      }
    }
  });
});

// Update attendance record
exports.updateAttendance = catchAsync(async (req, res) => {
  const { date, checkIn, checkOut, status, notes, shift } = req.body;
  
  const attendance = await Attendance.findById(req.params.id);
  
  if (!attendance) {
    throw createError(404, 'No attendance record found with that ID');
  }

  // Calculate work hours if both checkIn and checkOut are provided
  let workHours = attendance.workHours;
  if (checkIn?.time && checkOut?.time) {
    const checkInTime = new Date(checkIn.time);
    const checkOutTime = new Date(checkOut.time);
    workHours = calculateWorkHours(checkInTime, checkOutTime);
  }

  const updatedAttendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    {
      date: date ? new Date(date) : attendance.date,
      checkIn: checkIn ? {
        time: new Date(checkIn.time),
        device: checkIn.device || 'Web',
        ipAddress: checkIn.ipAddress
      } : attendance.checkIn,
      checkOut: checkOut ? {
        time: new Date(checkOut.time),
        device: checkOut.device || 'Web',
        ipAddress: checkOut.ipAddress
      } : attendance.checkOut,
      status: status || attendance.status,
      notes: notes !== undefined ? notes : attendance.notes,
      shift: shift || attendance.shift,
      workHours
    },
    {
      new: true,
      runValidators: true
    }
  ).populate({
    path: 'employee',
    select: 'firstName lastName department position',
    populate: [
      { path: 'department', select: 'name' },
      { path: 'position', select: 'title' }
    ]
  });

  res.status(200).json({
    status: 'success',
    data: { attendance: updatedAttendance }
  });
});

// Get employee attendance by date range
exports.getEmployeeAttendance = catchAsync(async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get employee ID from user object
    let employeeId;
    
    // If user has department, they are an Employee model instance
    if (req.user.department) {
      employeeId = req.user._id;
    } else {
      // Try to find associated employee by email
      const employee = await Employee.findOne({ email: req.user.email });
      if (!employee) {
        return next(createError(404, 'No employee record found for this user'));
      }
      employeeId = employee._id;
    }
    
    let query = { 
      employee: employeeId,
      isDeleted: false 
    };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName department position email',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'position', select: 'title' }
        ]
      })
      .sort('-date')
      .lean();

    // Get employee details
    const employeeDetails = attendance[0]?.employee || null;

    // Calculate overall statistics
    const overallStats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      late: attendance.filter(a => a.status === 'Late').length,
      halfDay: attendance.filter(a => a.status === 'Half-Day').length,
      earlyLeave: attendance.filter(a => a.status === 'Early-Leave').length,
      onLeave: attendance.filter(a => a.status === 'On-Leave').length,
      totalWorkHours: Number(attendance.reduce((sum, record) => sum + (record.workHours || 0), 0).toFixed(2)),
      averageWorkHours: Number((attendance.reduce((sum, record) => sum + (record.workHours || 0), 0) / (attendance.length || 1)).toFixed(2))
    };

    // Format attendance records with proper date strings
    const formattedAttendance = attendance.map(record => ({
      ...record,
      date: new Date(record.date).toISOString(),
      checkIn: record.checkIn ? {
        ...record.checkIn,
        time: record.checkIn.time ? new Date(record.checkIn.time).toISOString() : null
      } : null,
      checkOut: record.checkOut ? {
        ...record.checkOut,
        time: record.checkOut.time ? new Date(record.checkOut.time).toISOString() : null
      } : null,
      monthYear: new Date(record.date).toLocaleString('default', { month: 'long', year: 'numeric' })
    }));

    // Group by month for statistics
    const monthlyStats = formattedAttendance.reduce((acc, record) => {
      const monthYear = record.monthYear;
      if (!acc[monthYear]) {
        acc[monthYear] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          earlyLeave: 0,
          onLeave: 0,
          totalWorkHours: 0,
          averageWorkHours: 0
        };
      }
      
      acc[monthYear].total++;
      acc[monthYear][record.status.toLowerCase()] = (acc[monthYear][record.status.toLowerCase()] || 0) + 1;
      acc[monthYear].totalWorkHours += record.workHours || 0;
      acc[monthYear].averageWorkHours = Number((acc[monthYear].totalWorkHours / acc[monthYear].total).toFixed(2));
      
      return acc;
    }, {});

    res.status(200).json({
      status: 'success',
      data: {
        employee: employeeDetails,
        attendance: formattedAttendance,
        monthlyStats,
        overallStats,
        dateRange: {
          startDate,
          endDate
        }
      }
    });
  } catch (error) {
    console.error('Error in getEmployeeAttendance:', error);
    return next(createError(500, 'Error retrieving attendance records'));
  }
});

// Get attendance records by employee ID
exports.getAttendanceByEmployeeId = catchAsync(async (req, res) => {
  const { employeeId } = req.params;
  const { startDate, endDate, status } = req.query;
  
  // Build query
  let query = { 
    employee: employeeId,
    isDeleted: false 
  };
  
  // Add date range filter if provided
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Add status filter if provided
  if (status) {
    query.status = status;
  }

  const attendance = await Attendance.find(query)
    .populate({
      path: 'employee',
      select: 'firstName lastName department position',
      populate: [
        { path: 'department', select: 'name' },
        { path: 'position', select: 'title' }
      ]
    })
    .sort('-date');

  // Calculate statistics
  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    late: attendance.filter(a => a.status === 'Late').length,
    halfDay: attendance.filter(a => a.status === 'Half-Day').length,
    earlyLeave: attendance.filter(a => a.status === 'Early-Leave').length,
    onLeave: attendance.filter(a => a.status === 'On-Leave').length,
    totalWorkHours: attendance.reduce((sum, record) => sum + (record.workHours || 0), 0)
  };

  res.status(200).json({
    status: 'success',
    data: {
      attendance,
      stats
    }
  });
}); 