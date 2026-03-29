const Slot = require('../models/Slot');

/**
 * GET /api/slots/availability?date=2026-04-01
 * GET /api/slots/availability?start_date=2026-04-01&end_date=2026-04-07
 */
exports.getAvailability = async (req, res) => {
  try {
    const { date, start_date, end_date } = req.query;

    // Single date query
    if (date) {
      if (!isValidDate(date)) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
      }
      const slots = await Slot.getAvailability(date);
      return res.json({ date, slots });
    }

    // Date range query
    if (start_date && end_date) {
      if (!isValidDate(start_date) || !isValidDate(end_date)) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
      }
      if (new Date(start_date) > new Date(end_date)) {
        return res.status(400).json({ message: 'start_date must be before or equal to end_date.' });
      }
      const diffDays = (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24);
      if (diffDays > 30) {
        return res.status(400).json({ message: 'Date range cannot exceed 30 days.' });
      }
      const availability = await Slot.getAvailabilityRange(start_date, end_date);
      return res.json({ start_date, end_date, availability });
    }

    return res.status(400).json({ message: 'Provide "date" or both "start_date" and "end_date" query parameters.' });
  } catch (error) {
    console.error('getAvailability error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}
