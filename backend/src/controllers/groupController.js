// T-12 | Mustafa Göçmen | Sprint 1
// Open-group creation API

const GroupReservation = require('../models/GroupReservation');

const OPEN_HOUR  = 10;
const CLOSE_HOUR = 22;

// POST /api/groups
const create = async (req, res) => {
  try {
    const { name, date, time, partySize, leaderPlayerCount } = req.body;
    const leaderUserId = req.user.id;

    if (!name || !date || !time || partySize === undefined || leaderPlayerCount === undefined) {
      return res.status(400).json({ message: 'name, date, time, partySize and leaderPlayerCount are required.' });
    }

    const parsedPartySize        = parseInt(partySize);
    const parsedLeaderPlayerCount = parseInt(leaderPlayerCount);

    if (isNaN(parsedPartySize) || parsedPartySize < 3 || parsedPartySize > 20) {
      return res.status(400).json({ message: 'partySize must be between 3 and 20.' });
    }

    if (isNaN(parsedLeaderPlayerCount) || parsedLeaderPlayerCount < 1 || parsedLeaderPlayerCount > parsedPartySize) {
      return res.status(400).json({ message: 'leaderPlayerCount must be between 1 and partySize.' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Group name must be at least 2 characters.' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return res.status(400).json({ message: 'Date must be today or in the future.' });
    }

    const hour = parseInt(time.split(':')[0]);
    if (isNaN(hour) || hour < OPEN_HOUR || hour >= CLOSE_HOUR) {
      return res.status(400).json({ message: `Time must be between ${OPEN_HOUR}:00 and ${CLOSE_HOUR - 1}:00.` });
    }

    const group = await GroupReservation.create({
      leaderUserId,
      name: name.trim(),
      date,
      startTime: time,
      partySize: parsedPartySize,
      leaderPlayerCount: parsedLeaderPlayerCount,
    });

    return res.status(201).json({
      message: 'Group reservation created successfully.',
      group,
    });
  } catch (err) {
    console.error('[createGroup]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/groups — T-14 | Tuna Öcal | Sprint 1
// Supports query filters: ?date=YYYY-MM-DD&search=name&minPartySize=3&maxPartySize=10&availableOnly=true
const listOpen = async (req, res) => {
  try {
    const { date, search, minPartySize, maxPartySize, availableOnly } = req.query;
    const filters = {};

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
      }
      filters.date = date;
    }

    if (search && search.trim()) {
      filters.search = search.trim();
    }

    if (minPartySize) {
      const val = parseInt(minPartySize);
      if (isNaN(val) || val < 1) {
        return res.status(400).json({ message: 'minPartySize must be a positive integer.' });
      }
      filters.minPartySize = val;
    }

    if (maxPartySize) {
      const val = parseInt(maxPartySize);
      if (isNaN(val) || val < 1) {
        return res.status(400).json({ message: 'maxPartySize must be a positive integer.' });
      }
      filters.maxPartySize = val;
    }

    if (availableOnly) {
      filters.availableOnly = availableOnly;
    }

    const groups = await GroupReservation.findOpen(filters);
    return res.status(200).json({ groups });
  } catch (err) {
    console.error('[listOpenGroups]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/groups/my
const listMine = async (req, res) => {
  try {
    const groups = await GroupReservation.findByLeader(req.user.id);
    return res.status(200).json({ groups });
  } catch (err) {
    console.error('[listMyGroups]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/groups/:id
const getOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid group ID.' });

    const group = await GroupReservation.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    return res.status(200).json({ group });
  } catch (err) {
    console.error('[getGroup]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE /api/groups/:id
const cancel = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid group ID.' });

    const cancelled = await GroupReservation.cancel(id, req.user.id);
    if (!cancelled) return res.status(404).json({ message: 'Group not found or you are not the leader.' });

    return res.status(200).json({ message: 'Group reservation cancelled.' });
  } catch (err) {
    console.error('[cancelGroup]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/groups/:id/join — T-16 | Tuna Öcal | Sprint 1
// Submit a join request for an open group
const submitJoinRequest = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    if (isNaN(groupId)) return res.status(400).json({ message: 'Invalid group ID.' });

    const { playerCount } = req.body;
    const userId = req.user.id;

    if (!playerCount || isNaN(parseInt(playerCount)) || parseInt(playerCount) < 1) {
      return res.status(400).json({ message: 'playerCount must be a positive integer.' });
    }

    const parsedPlayerCount = parseInt(playerCount);

    // Check group exists and is open
    const group = await GroupReservation.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.status !== 'open') return res.status(400).json({ message: 'This group is no longer accepting join requests.' });

    // Cannot join own group
    if (group.leaderUserId === userId) {
      return res.status(400).json({ message: 'You cannot join your own group.' });
    }

    // Check available spots
    const availableSpots = group.partySize - group.currentCount;
    if (parsedPlayerCount > availableSpots) {
      return res.status(400).json({
        message: `Not enough spots. Available: ${availableSpots}, requested: ${parsedPlayerCount}.`,
      });
    }

    // Check for existing request
    const existing = await GroupReservation.findJoinRequest(groupId, userId);
    if (existing) {
      return res.status(409).json({
        message: `You already have a ${existing.status} join request for this group.`,
      });
    }

    const joinRequest = await GroupReservation.createJoinRequest({
      groupReservationId: groupId,
      userId,
      playerCount: parsedPlayerCount,
    });

    return res.status(201).json({
      message: 'Join request submitted successfully.',
      joinRequest,
    });
  } catch (err) {
    console.error('[submitJoinRequest]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/groups/:id/requests — T-16 | Tuna Öcal | Sprint 1
// List join requests for a group (leader only)
const listJoinRequests = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    if (isNaN(groupId)) return res.status(400).json({ message: 'Invalid group ID.' });

    const group = await GroupReservation.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (group.leaderUserId !== req.user.id) {
      return res.status(403).json({ message: 'Only the group leader can view join requests.' });
    }

    const requests = await GroupReservation.findJoinRequestsByGroup(groupId);
    return res.status(200).json({ requests });
  } catch (err) {
    console.error('[listJoinRequests]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { create, listOpen, listMine, getOne, cancel, submitJoinRequest, listJoinRequests };
