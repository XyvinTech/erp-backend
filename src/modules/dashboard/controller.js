const { Employee, Department, Attendance, Position } = require('../hrm/models');

/**
 * Get dashboard statistics
 */
exports.getStats = async (req, res) => {
  try {
    // Get employee count
    const employeeCount = await Employee.countDocuments();

    // Get department count
    const departmentCount = await Department.countDocuments();

    // Get open positions count (assuming there's a status field)
    const openPositions = await Position.countDocuments({ status: 'open' });

    // Get present employees count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const presentToday = await Attendance.countDocuments({
      date: today,
      status: 'present'
    });

    res.json({
      employeeCount,
      departmentCount,
      openPositions,
      presentToday
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error getting dashboard stats' });
  }
};

/**
 * Get attendance data for chart
 */
exports.getAttendance = async (req, res) => {
  try {
    // Get attendance data for the last 7 days
    const dates = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const count = await Attendance.countDocuments({
        date: {
          $gte: date,
          $lt: nextDate
        },
        status: 'present'
      });
      
      dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      data.push(count);
    }

    res.json({
      labels: dates,
      data
    });
  } catch (error) {
    console.error('Error getting attendance data:', error);
    res.status(500).json({ message: 'Error getting attendance data' });
  }
};

/**
 * Get department distribution data
 */
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    const labels = [];
    const data = [];

    for (const department of departments) {
      const count = await Employee.countDocuments({ department: department._id });
      labels.push(department.name);
      data.push(count);
    }

    res.json({
      labels,
      data
    });
  } catch (error) {
    console.error('Error getting department data:', error);
    res.status(500).json({ message: 'Error getting department data' });
  }
}; 