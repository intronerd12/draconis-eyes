const Scan = require('../models/Scan');

// @desc    Get all scans
// @route   GET /api/scans
// @access  Private (Admin) or Public (depending on requirements)
const getScans = async (req, res) => {
  try {
    const scans = await Scan.find().sort({ createdAt: -1 }).populate('user', 'name email');
    res.status(200).json(scans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new scan
// @route   POST /api/scans
// @access  Private (User)
const createScan = async (req, res) => {
  try {
    const { grade, details, imageUrl, location, timestamp, userId } = req.body;

    const payload = {
      grade,
      details,
      imageUrl,
      location,
      timestamp: timestamp || Date.now(),
    };

    if (userId) {
      payload.user = userId;
    }

    const scan = await Scan.create(payload);

    res.status(201).json(scan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get scan statistics
// @route   GET /api/scans/stats
// @access  Private (Admin)
const getScanStats = async (req, res) => {
  try {
    const total = await Scan.countDocuments();
    
    // Aggregation for grades
    const gradeStats = await Scan.aggregate([
      { $group: { _id: "$grade", count: { $sum: 1 } } }
    ]);

    // Aggregation for last 7 days
    const last7Days = await Scan.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Aggregation for last 6 months
    const last6Months = await Scan.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Determine best grade (A > B > C > D > F)
    const grades = gradeStats.map(g => g._id);
    let best = '-';
    if (grades.includes('A')) best = 'A';
    else if (grades.includes('B')) best = 'B';
    else if (grades.includes('C')) best = 'C';
    else if (grades.includes('D')) best = 'D';

    // Calculate average pass rate or similar metric if needed
    // For now, just returning grade distribution
    
    res.status(200).json({
      total,
      best,
      gradeStats,
      last7Days,
      last6Months
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getScans,
  createScan,
  getScanStats
};
