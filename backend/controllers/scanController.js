const Scan = require('../models/Scan');
const User = require('../models/User');
const mongoose = require('mongoose');

const normalizeText = (value) => {
  if (value === undefined || value === null) return undefined;
  const out = String(value).trim();
  return out.length ? out : undefined;
};

const normalizeGrade = (value) => {
  const cleaned = normalizeText(value);
  return cleaned ? cleaned.toUpperCase() : 'UNKNOWN';
};

// @desc    Get all scans
// @route   GET /api/scans
// @access  Private (Admin) or Public (depending on requirements)
const getScans = async (req, res) => {
  try {
    const scans = await Scan.find().sort({ timestamp: -1, createdAt: -1 }).populate('user', 'name email');
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
    const {
      grade,
      details,
      imageUrl,
      location,
      timestamp,
      userId,
      operatorName,
      operatorEmail,
      fruitType,
      localScanId,
      source,
    } = req.body;

    const normalizedEmail = normalizeText(operatorEmail)?.toLowerCase();
    const userIdCandidate = normalizeText(userId);
    let resolvedUser = null;

    if (userIdCandidate && mongoose.Types.ObjectId.isValid(userIdCandidate)) {
      resolvedUser = await User.findById(userIdCandidate).select('_id name email');
    } else if (normalizedEmail) {
      resolvedUser = await User.findOne({ email: normalizedEmail }).select('_id name email');
    }

    const parsedTimestamp = timestamp ? new Date(timestamp) : null;
    const safeTimestamp = parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
      ? parsedTimestamp
      : new Date();

    const normalizedLocalScanId = normalizeText(localScanId);
    const payload = {
      grade: normalizeGrade(grade),
      details: normalizeText(details),
      imageUrl: normalizeText(imageUrl),
      location: normalizeText(location),
      timestamp: safeTimestamp,
      operatorName: normalizeText(operatorName) || resolvedUser?.name,
      operatorEmail: normalizedEmail || resolvedUser?.email,
      fruitType: normalizeText(fruitType),
      localScanId: normalizedLocalScanId,
      source: normalizeText(source) || 'mobile_app',
    };

    if (resolvedUser?._id) {
      payload.user = resolvedUser._id;
    }

    let scan = null;
    let statusCode = 200;
    if (normalizedLocalScanId) {
      const dedupeQuery = { localScanId: normalizedLocalScanId };
      if (normalizedEmail) {
        dedupeQuery.operatorEmail = normalizedEmail;
      } else if (resolvedUser?._id) {
        dedupeQuery.user = resolvedUser._id;
      }

      scan = await Scan.findOneAndUpdate(
        dedupeQuery,
        { $set: payload },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ).populate('user', 'name email');

      if (scan?.createdAt && scan?.updatedAt && scan.createdAt.getTime() === scan.updatedAt.getTime()) {
        statusCode = 201;
      }
    } else {
      scan = await Scan.create(payload);
      statusCode = 201;
    }

    res.status(statusCode).json(scan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete scan by local scan id
// @route   DELETE /api/scan/:localScanId
// @access  Private (User)
const deleteScanByLocalScanId = async (req, res) => {
  try {
    const localScanId = normalizeText(req.params.localScanId);
    if (!localScanId) {
      return res.status(400).json({ message: 'localScanId is required' });
    }

    const rawOperatorEmail = normalizeText(req.query?.operatorEmail);
    const rawUserId = normalizeText(req.query?.userId);
    const operatorEmail = rawOperatorEmail ? rawOperatorEmail.toLowerCase() : null;

    const query = { localScanId };
    if (operatorEmail) {
      query.operatorEmail = operatorEmail;
    } else if (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)) {
      query.user = rawUserId;
    }

    const deleted = await Scan.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    return res.status(200).json({ message: 'Scan deleted', id: deleted._id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
          timestamp: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Aggregation for last 6 months
    const last6Months = await Scan.aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$timestamp" } },
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
    else if (grades.includes('E')) best = 'E';

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

const buildLast7DayBuckets = () => {
  const today = new Date();
  const buckets = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setHours(0, 0, 0, 0);
    day.setDate(today.getDate() - i);
    const isoDate = day.toISOString().slice(0, 10);
    buckets.push({
      isoDate,
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      total: 0,
      mobile: 0,
      web: 0,
    });
  }
  return buckets;
};

const getScanAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalScans,
      totalUsers,
      activeUsers,
      usersLoggedIn24h,
      gradeStats,
      sourceStats,
      recentScanCounts,
      loginCounts,
      rotSignals,
      insectSignals,
      fungalSignals,
    ] = await Promise.all([
      Scan.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ last_login_at: { $gte: twentyFourHoursAgo } }),
      Scan.aggregate([
        { $group: { _id: '$grade', count: { $sum: 1 } } },
      ]),
      Scan.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
      Scan.aggregate([
        {
          $match: {
            timestamp: { $gte: sevenDaysAgo },
          },
        },
        {
          $project: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            source: {
              $toLower: { $ifNull: ['$source', 'unknown'] },
            },
          },
        },
        {
          $group: {
            _id: { day: '$day', source: '$source' },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        {
          $match: {
            last_login_at: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$last_login_at' } },
            count: { $sum: 1 },
          },
        },
      ]),
      Scan.countDocuments({ details: { $regex: /(rot|decay)/i } }),
      Scan.countDocuments({ details: { $regex: /insect/i } }),
      Scan.countDocuments({ details: { $regex: /fungal|fungus|mold/i } }),
    ]);

    const trendBuckets = buildLast7DayBuckets();
    const trendByDay = new Map(trendBuckets.map((item) => [item.isoDate, item]));

    for (const row of recentScanCounts) {
      const day = row?._id?.day;
      const rawSource = row?._id?.source || 'unknown';
      const count = row?.count || 0;
      const bucket = trendByDay.get(day);
      if (!bucket) continue;

      const normalizedSource = String(rawSource).toLowerCase();
      const isMobile = normalizedSource.includes('mobile');
      const isWeb = normalizedSource.includes('web');

      bucket.total += count;
      if (isMobile) bucket.mobile += count;
      else if (isWeb) bucket.web += count;
      else bucket.web += count;
    }

    const loginByDay = new Map(
      loginCounts.map((row) => [row?._id, row?.count || 0])
    );
    const loginTrend = trendBuckets.map((item) => ({
      date: item.isoDate,
      label: item.label,
      logins: loginByDay.get(item.isoDate) || 0,
    }));

    const scanTrend = trendBuckets.map(({ isoDate, label, total, mobile, web }) => ({
      date: isoDate,
      label,
      scans: total,
      mobileScans: mobile,
      webScans: web,
    }));

    const gradeOrder = ['A', 'B', 'C', 'D', 'E', 'UNKNOWN'];
    const gradeMap = new Map(
      gradeStats.map((row) => [String(row?._id || 'UNKNOWN').toUpperCase(), row?.count || 0])
    );
    const gradeDistribution = gradeOrder
      .filter((grade) => gradeMap.has(grade) || grade !== 'UNKNOWN')
      .map((grade) => ({
        grade,
        count: gradeMap.get(grade) || 0,
      }))
      .filter((row) => row.count > 0 || row.grade !== 'UNKNOWN');

    const normalizedSourceRows = sourceStats.map((row) => {
      const sourceValue = String(row?._id || 'unknown').toLowerCase();
      let label = 'Other';
      if (sourceValue.includes('mobile')) label = 'Mobile';
      else if (sourceValue.includes('web')) label = 'Web';
      else if (sourceValue === 'unknown') label = 'Unknown';
      return { source: label, count: row?.count || 0 };
    });

    const sourceMap = normalizedSourceRows.reduce((acc, row) => {
      acc[row.source] = (acc[row.source] || 0) + row.count;
      return acc;
    }, {});

    const sourceDistribution = Object.entries(sourceMap).map(([source, count]) => ({
      source,
      count,
    }));

    const mobileScans = sourceDistribution
      .filter((row) => row.source === 'Mobile')
      .reduce((sum, row) => sum + row.count, 0);
    const webScans = sourceDistribution
      .filter((row) => row.source === 'Web')
      .reduce((sum, row) => sum + row.count, 0);

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      totals: {
        scans: totalScans,
        users: totalUsers,
        activeUsers,
        mobileScans,
        webScans,
        logins24h: usersLoggedIn24h,
      },
      scanTrend,
      loginTrend,
      gradeDistribution,
      sourceDistribution,
      diseaseSignals: [
        { name: 'Rot/Decay Signal', count: rotSignals },
        { name: 'Fungal Signal', count: fungalSignals },
        { name: 'Insect Signal', count: insectSignals },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load analytics data' });
  }
};

module.exports = {
  getScans,
  createScan,
  deleteScanByLocalScanId,
  getScanStats,
  getScanAnalytics,
};
