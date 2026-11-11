const Visit = require('../models/Visit');
const DailyStat = require('../models/DailyStat');
const PageView = require('../models/PageView');
const {
  generateVisitorHash,
  parseDevice,
  parseBrowser,
  sanitizeReferrer,
} = require('../utils/visitorHash');

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Record a visit / page view with privacy-conscious analytics
 * POST /api/analytics/visit
 */
const recordVisit = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const visitorHash = generateVisitorHash(req);
    const userAgent = req.headers['user-agent'] || '';
    const device = parseDevice(userAgent);
    const browser = parseBrowser(userAgent);
    const referrer = sanitizeReferrer(req.body.referrer || req.headers.referer || '');
    const section = (req.body.section || 'home').toLowerCase().replace('#', '');

    // Check if this visitor has visited before (returning visitor check)
    const previousVisit = await Visit.findOne({
      anonymousVisitorIdHash: visitorHash,
      visitDate: { $ne: today },
    });
    const isReturning = !!previousVisit;

    // Record page view event
    await PageView.create({
      visitorHash,
      date: today,
      section,
      referrer,
      device,
      browser,
      isReturning,
    });

    let isNewVisitToday = false;
    try {
      await Visit.create({
        anonymousVisitorIdHash: visitorHash,
        visitDate: today,
      });
      isNewVisitToday = true;
    } catch (err) {
      if (err.code !== 11000) throw err;
    }

    if (isNewVisitToday) {
      await DailyStat.findOneAndUpdate(
        { date: today },
        { $inc: { count: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Calculate total unique visitors
    const totalVisitorsAgg = await PageView.aggregate([
      { $group: { _id: '$visitorHash' } },
      { $count: 'total' },
    ]);
    const totalVisits = totalVisitorsAgg[0]?.total || 0;

    const todayStat = await DailyStat.findOne({ date: today });
    const todayCount = todayStat?.count || 0;

    return res.status(200).json({
      success: true,
      value: totalVisits,
      today: todayCount,
      isNewVisitToday,
      isReturning,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public counter for footer
 * GET /api/analytics/visitors
 */
const getPublicVisitorCount = async (req, res, next) => {
  try {
    const totalVisitorsAgg = await PageView.aggregate([
      { $group: { _id: '$visitorHash' } },
      { $count: 'total' },
    ]);
    const totalVisits = totalVisitorsAgg[0]?.total || 0;

    return res.status(200).json({
      success: true,
      value: totalVisits,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordVisit,
  getPublicVisitorCount,
};
