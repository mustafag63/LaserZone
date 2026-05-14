const Slot = require('../models/Slot');

const ALLOWED_DURATIONS = [30, 60];

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

// GET /api/slots/settings
exports.getSettings = async (_req, res) => {
  try {
    const settings = await Slot.getSettings();
    return res.status(200).json({ settings });
  } catch (error) {
    console.error('getSlotSettings error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/slots/settings
exports.updateSettings = async (req, res) => {
  try {
    const { openTime, closeTime, slotDurationMinutes, maxCapacity, isOpen } = req.body;

    if (!isValidTime(openTime) || !isValidTime(closeTime)) {
      return res.status(400).json({ message: 'openTime and closeTime must use HH:mm or HH:mm:ss format.' });
    }

    const duration = parseInt(slotDurationMinutes);
    if (!ALLOWED_DURATIONS.includes(duration)) {
      return res.status(400).json({ message: 'slotDurationMinutes must be 30 or 60.' });
    }

    const capacity = parseInt(maxCapacity);
    if (isNaN(capacity) || capacity < 1 || capacity > 100) {
      return res.status(400).json({ message: 'maxCapacity must be between 1 and 100.' });
    }

    const openMinutes = timeToMinutes(openTime);
    const closeMinutes = timeToMinutes(closeTime);
    if (openMinutes >= closeMinutes) {
      return res.status(400).json({ message: 'openTime must be before closeTime.' });
    }
    if ((closeMinutes - openMinutes) < duration) {
      return res.status(400).json({ message: 'Working hours must contain at least one slot.' });
    }
    if ((closeMinutes - openMinutes) % duration !== 0) {
      return res.status(400).json({ message: 'Working hours must divide evenly by slotDurationMinutes.' });
    }

    const settings = await Slot.updateSettings({
      openTime,
      closeTime,
      slotDurationMinutes: duration,
      maxCapacity: capacity,
      isOpen: isOpen !== false,
    });

    return res.status(200).json({ message: 'Slot settings updated.', settings });
  } catch (error) {
    console.error('updateSlotSettings error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/slots/blocks?date=YYYY-MM-DD
exports.getBlocks = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !isValidDate(date)) {
      return res.status(400).json({ message: 'Provide a valid date using YYYY-MM-DD.' });
    }

    const blocks = await Slot.getBlocks(date);
    return res.status(200).json({ date, blocks });
  } catch (error) {
    console.error('getSlotBlocks error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/slots/blocks
exports.createBlock = async (req, res) => {
  try {
    const { date, startTime, endTime, reason } = req.body;

    if (!date || !isValidDate(date)) {
      return res.status(400).json({ message: 'date must use YYYY-MM-DD format.' });
    }
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({ message: 'startTime and endTime must use HH:mm or HH:mm:ss format.' });
    }
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({ message: 'startTime must be before endTime.' });
    }

    const block = await Slot.blockSlot({
      date,
      startTime,
      endTime,
      reason: typeof reason === 'string' ? reason.trim() : '',
    });

    return res.status(201).json({ message: 'Slot block created.', block });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'This slot block already exists.' });
    }
    console.error('createSlotBlock error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/slots/blocks/:id
exports.deleteBlock = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid block ID.' });
    }

    const deleted = await Slot.unblockSlot(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Slot block not found.' });
    }

    return res.status(200).json({ message: 'Slot block deleted.' });
  } catch (error) {
    console.error('deleteSlotBlock error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}

function isValidTime(str) {
  return typeof str === 'string' && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(str);
}

function timeToMinutes(str) {
  const [hours, minutes] = str.split(':').map(Number);
  return hours * 60 + minutes;
}
