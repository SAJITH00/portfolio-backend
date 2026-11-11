const ContactMessage = require('../models/ContactMessage');
const DailyStat = require('../models/DailyStat');
const Visit = require('../models/Visit');
const PageView = require('../models/PageView');
const Project = require('../models/Project');

// Messages List
const getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const filter = {};
    if (status === 'unread') filter.isRead = false;
    else if (status === 'read') filter.isRead = true;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { subject: regex }, { message: regex }];
    }

    const searchFilter = {};
    if (filter.$or) searchFilter.$or = filter.$or;

    const [total, messages, allCount, unreadCount, readCount] = await Promise.all([
      ContactMessage.countDocuments(filter),
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactMessage.countDocuments(searchFilter),
      ContactMessage.countDocuments({ ...searchFilter, isRead: false }),
      ContactMessage.countDocuments({ ...searchFilter, isRead: true }),
    ]);

    return res.status(200).json({
      success: true,
      data: messages,
      counts: {
        all: allCount,
        unread: unreadCount,
        read: readCount,
      },
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Message By ID
const getMessageById = async (req, res, next) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });
    return res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// Mark Read/Unread
const markMessageRead = async (req, res, next) => {
  try {
    const { isRead } = req.body;
    const targetState = typeof isRead === 'boolean' ? isRead : true;
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: targetState },
      { new: true }
    );
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });
    return res.status(200).json({ success: true, message: `Message updated.`, data: message });
  } catch (error) {
    next(error);
  }
};

// Delete Message
const deleteMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });
    return res.status(200).json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Advanced Admin Analytics with Chart.js time series & date range filters
 * GET /api/admin/analytics
 */
const getAnalyticsOverview = async (req, res, next) => {
  try {
    const { range = '30d', startDate, endDate } = req.query;

    const todayDate = new Date();
    const todayStr = todayDate.toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.slice(0, 7); // 'YYYY-MM'

    // Determine date query bounds
    let filterStart = new Date();
    let filterEnd = new Date();

    if (range === 'today') {
      filterStart.setHours(0, 0, 0, 0);
    } else if (range === '7d') {
      filterStart.setDate(todayDate.getDate() - 7);
    } else if (range === '30d') {
      filterStart.setDate(todayDate.getDate() - 30);
    } else if (range === '90d') {
      filterStart.setDate(todayDate.getDate() - 90);
    } else if (range === 'custom' && startDate) {
      filterStart = new Date(startDate);
      if (endDate) filterEnd = new Date(endDate);
    } else {
      filterStart.setDate(todayDate.getDate() - 30);
    }

    const startStr = filterStart.toISOString().split('T')[0];
    const endStr = filterEnd.toISOString().split('T')[0];

    // Summary Card Aggregations
    const [
      totalPageViews,
      totalUniqueVisitorsAgg,
      todayUniqueStat,
      monthUniqueVisitsAgg,
      todayPageViews,
      totalProjects,
      totalMessages,
      unreadMessages,
      returningVisitorsCount,
    ] = await Promise.all([
      PageView.countDocuments(),
      PageView.aggregate([{ $group: { _id: '$visitorHash' } }, { $count: 'total' }]),
      DailyStat.findOne({ date: todayStr }),
      DailyStat.aggregate([
        { $match: { date: { $regex: `^${currentMonthPrefix}` } } },
        { $group: { _id: null, total: { $sum: '$count' } } },
      ]),
      PageView.countDocuments({ date: todayStr }),
      Project.countDocuments(),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ isRead: false }),
      PageView.countDocuments({ isReturning: true }),
    ]);

    const totalUniqueVisitors = totalUniqueVisitorsAgg[0]?.total || 0;
    const todayVisitors = todayUniqueStat?.count || 0;
    const monthVisitors = monthUniqueVisitsAgg[0]?.total || 0;

    // Time-series Chart Data (Filtered Range)
    const [dailyStatsRange, dailyPageViewsRange] = await Promise.all([
      DailyStat.find({ date: { $gte: startStr, $lte: endStr } }).sort({ date: 1 }),
      PageView.aggregate([
        { $match: { date: { $gte: startStr, $lte: endStr } } },
        { $group: { _id: '$date', views: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Build timeline map
    const pageViewsMap = new Map();
    dailyPageViewsRange.forEach((d) => pageViewsMap.set(d._id, d.views));

    const chartTimeline = dailyStatsRange.map((stat) => ({
      date: stat.date,
      visitors: stat.count,
      pageViews: pageViewsMap.get(stat.date) || stat.count,
    }));

    // Breakdowns: Device, Browser, Referrer, Sections
    const [devicesBreakdown, browsersBreakdown, referrersBreakdown, sectionsBreakdown] =
      await Promise.all([
        PageView.aggregate([
          { $group: { _id: '$device', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        PageView.aggregate([
          { $group: { _id: '$browser', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
        PageView.aggregate([
          { $group: { _id: '$referrer', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
        PageView.aggregate([
          { $group: { _id: '$section', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
      ]);

    const recentMessages = await ContactMessage.find().sort({ createdAt: -1 }).limit(5);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPageViews,
          uniqueVisitors: totalUniqueVisitors,
          todayVisitors,
          todayPageViews,
          monthVisitors,
          totalProjects,
          totalMessages,
          unreadMessages,
          returningVisitorsCount,
        },
        chartTimeline,
        breakdowns: {
          devices: devicesBreakdown.map((d) => ({ name: d._id || 'Unknown', count: d.count })),
          browsers: browsersBreakdown.map((b) => ({ name: b._id || 'Other', count: b.count })),
          referrers: referrersBreakdown.map((r) => ({ name: r._id || 'Direct', count: r.count })),
          sections: sectionsBreakdown.map((s) => ({ name: s._id || 'Home', count: s.count })),
        },
        recentMessages,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  getMessageById,
  markMessageRead,
  deleteMessage,
  getAnalyticsOverview,
};
