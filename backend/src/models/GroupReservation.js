// T-12 | Mustafa Göçmen | Sprint 1
// Group reservation model

const pool = require('../config/db');
const Slot = require('./Slot');

async function slotBooked(date, startTimeFull, { excludeReservationId = null, excludeGroupId = null } = {}) {
  const [r] = await pool.execute(
    `SELECT COALESCE(SUM(player_count), 0) AS booked
     FROM reservations
     WHERE reservation_date = ? AND start_time = ? AND status = 'active'
       ${excludeReservationId ? 'AND id != ?' : ''}`,
    excludeReservationId ? [date, startTimeFull, excludeReservationId] : [date, startTimeFull]
  );
  const [g] = await pool.execute(
    `SELECT COALESCE(SUM(current_count), 0) AS booked
     FROM group_reservations
     WHERE reservation_date = ? AND start_time = ? AND status IN ('open', 'closed')
       ${excludeGroupId ? 'AND id != ?' : ''}`,
    excludeGroupId ? [date, startTimeFull, excludeGroupId] : [date, startTimeFull]
  );
  return Number(r[0].booked) + Number(g[0].booked);
}

const GroupReservation = {
  async createTables() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS group_reservations (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        leader_user_id    INT NOT NULL,
        reservation_name  VARCHAR(100) NOT NULL,
        reservation_date  DATE NOT NULL,
        start_time        TIME NOT NULL,
        end_time          TIME NOT NULL,
        party_size        INT NOT NULL,
        current_count     INT NOT NULL DEFAULT 0,
        status            ENUM('open','closed','cancelled') NOT NULL DEFAULT 'open',
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leader_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS join_requests (
        id                      INT AUTO_INCREMENT PRIMARY KEY,
        group_reservation_id    INT NOT NULL,
        user_id                 INT NOT NULL,
        player_count            INT NOT NULL,
        status                  ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_request (group_reservation_id, user_id),
        FOREIGN KEY (group_reservation_id) REFERENCES group_reservations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.execute(`
      ALTER TABLE join_requests
      MODIFY status ENUM('pending','approved','rejected','left','removed') NOT NULL DEFAULT 'pending'
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id                      INT AUTO_INCREMENT PRIMARY KEY,
        group_reservation_id    INT NOT NULL,
        user_id                 INT NOT NULL,
        player_count            INT NOT NULL,
        status                  ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_leave_request_member (group_reservation_id, user_id, status),
        FOREIGN KEY (group_reservation_id) REFERENCES group_reservations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  },

  // Create a new open group reservation
  async create({ leaderUserId, name, date, startTime, partySize, leaderPlayerCount }) {
    const startTimeFull = startTime.length === 5 ? `${startTime}:00` : startTime;
    const endHour = String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0');
    const endTime = `${endHour}:00:00`;

    // One group per slot rule
    const [existing] = await pool.execute(
      `SELECT id FROM group_reservations
       WHERE reservation_date = ? AND start_time = ? AND status IN ('open', 'closed')
       LIMIT 1`,
      [date, startTimeFull]
    );
    if (existing.length > 0) {
      return { error: 'group_exists' };
    }

    // Capacity check across both tables
    const settings = await Slot.getSettings();
    const booked = await slotBooked(date, startTimeFull);
    if (booked + leaderPlayerCount > settings.max_capacity) {
      return { error: 'slot_full' };
    }

    const [result] = await pool.execute(
      `INSERT INTO group_reservations
         (leader_user_id, reservation_name, reservation_date, start_time, end_time, party_size, current_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [leaderUserId, name, date, startTimeFull, endTime, partySize, leaderPlayerCount]
    );

    return {
      id: result.insertId,
      leaderUserId,
      name,
      date,
      startTime: startTimeFull,
      endTime,
      partySize,
      currentCount: leaderPlayerCount,
      status: 'open',
    };
  },

  // List all open groups (for browsing) with optional filters
  async findOpen(filters = {}) {
    const conditions = ["g.status IN ('open', 'closed')"];
    const params = [];

    if (filters.date) {
      conditions.push('g.reservation_date = ?');
      params.push(filters.date);
    }

    if (filters.search) {
      conditions.push('g.reservation_name LIKE ?');
      params.push(`%${filters.search}%`);
    }

    if (filters.minPartySize) {
      conditions.push('g.party_size >= ?');
      params.push(parseInt(filters.minPartySize));
    }

    if (filters.maxPartySize) {
      conditions.push('g.party_size <= ?');
      params.push(parseInt(filters.maxPartySize));
    }

    if (filters.availableOnly === 'true') {
      conditions.push('g.current_count < g.party_size');
    }

    const [rows] = await pool.execute(
      `SELECT g.id, g.reservation_name AS name,
              DATE_FORMAT(g.reservation_date, '%Y-%m-%d') AS date,
              TIME_FORMAT(g.start_time, '%H:%i') AS startTime,
              TIME_FORMAT(g.end_time, '%H:%i') AS endTime,
              g.party_size AS partySize, g.current_count AS currentCount,
              g.status, g.created_at,
              u.username AS leaderUsername
       FROM group_reservations g
       JOIN users u ON u.id = g.leader_user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY g.reservation_date ASC, g.start_time ASC`,
      params
    );
    return rows;
  },

  // Get single group by id
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT g.id, g.leader_user_id AS leaderUserId,
              g.reservation_name AS name,
              DATE_FORMAT(g.reservation_date, '%Y-%m-%d') AS date,
              TIME_FORMAT(g.start_time, '%H:%i') AS startTime,
              TIME_FORMAT(g.end_time, '%H:%i') AS endTime,
              g.party_size AS partySize, g.current_count AS currentCount,
              g.status, g.created_at,
              u.username AS leaderUsername
       FROM group_reservations g
       JOIN users u ON u.id = g.leader_user_id
       WHERE g.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // Get groups led by a specific user
  async findByLeader(leaderUserId) {
    const [rows] = await pool.execute(
      `SELECT id, reservation_name AS name,
              DATE_FORMAT(reservation_date, '%Y-%m-%d') AS date,
              TIME_FORMAT(start_time, '%H:%i') AS startTime,
              TIME_FORMAT(end_time, '%H:%i') AS endTime,
              party_size AS partySize, current_count AS currentCount,
              status, created_at
       FROM group_reservations
       WHERE leader_user_id = ? AND status != 'cancelled'
       ORDER BY reservation_date ASC, start_time ASC`,
      [leaderUserId]
    );
    return rows;
  },

  // Past/finished groups the user led or was an approved member of
  async findHistoryByUser(userId) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const nowTime = now.toTimeString().slice(0, 8);

    const [rows] = await pool.execute(
      `SELECT g.id, g.reservation_name AS name,
              DATE_FORMAT(g.reservation_date, '%Y-%m-%d') AS date,
              TIME_FORMAT(g.start_time, '%H:%i') AS startTime,
              TIME_FORMAT(g.end_time, '%H:%i') AS endTime,
              g.party_size AS partySize, g.current_count AS currentCount,
              g.status,
              CASE WHEN g.leader_user_id = ? THEN 'leader' ELSE 'member' END AS role
       FROM group_reservations g
       LEFT JOIN join_requests jr
              ON jr.group_reservation_id = g.id
             AND jr.user_id = ?
             AND jr.status = 'approved'
       WHERE (g.leader_user_id = ? OR jr.id IS NOT NULL)
         AND (g.status = 'cancelled'
              OR g.reservation_date < ?
              OR (g.reservation_date = ? AND g.end_time <= ?))
       ORDER BY g.reservation_date DESC, g.start_time DESC`,
      [userId, userId, userId, today, today, nowTime]
    );
    return rows;
  },

  // Update a group (leader only)
  async update(id, leaderUserId, { name, date, startTime, partySize, currentCount }) {
    const startTimeFull = startTime.length === 5 ? `${startTime}:00` : startTime;
    const endHour = String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0');
    const endTime = `${endHour}:00:00`;

    // One group per slot — make sure no other group owns the target slot
    const [conflicting] = await pool.execute(
      `SELECT id FROM group_reservations
       WHERE reservation_date = ? AND start_time = ? AND status IN ('open', 'closed') AND id != ?
       LIMIT 1`,
      [date, startTimeFull, id]
    );
    if (conflicting.length > 0) {
      return { error: 'group_exists' };
    }

    // Conflict check — exclude this group, use partySize as the footprint
    const settings = await Slot.getSettings();
    const booked = await slotBooked(date, startTimeFull, { excludeGroupId: id });
    if (booked + partySize > settings.max_capacity) {
      return null; // slot full
    }

    const [result] = await pool.execute(
      `UPDATE group_reservations
       SET reservation_name = ?, reservation_date = ?, start_time = ?, end_time = ?, party_size = ?
       WHERE id = ? AND leader_user_id = ? AND status != 'cancelled'`,
      [name, date, startTimeFull, endTime, partySize, id, leaderUserId]
    );
    return result.affectedRows > 0;
  },

  // Cancel a group (leader only)
  async cancel(id, leaderUserId) {
    const [result] = await pool.execute(
      `UPDATE group_reservations SET status = 'cancelled'
       WHERE id = ? AND leader_user_id = ? AND status = 'open'`,
      [id, leaderUserId]
    );
    return result.affectedRows > 0;
  },

  // Update current_count and auto-close when full
  async updateCount(id, newCount, partySize) {
    const newStatus = newCount >= partySize ? 'closed' : 'open';
    await pool.execute(
      `UPDATE group_reservations SET current_count = ?, status = ? WHERE id = ?`,
      [newCount, newStatus, id]
    );
    return newStatus;
  },

  async findApprovedMembership(groupReservationId, userId) {
    const [rows] = await pool.execute(
      `SELECT id, player_count AS playerCount
       FROM join_requests
       WHERE group_reservation_id = ? AND user_id = ? AND status = 'approved'`,
      [groupReservationId, userId]
    );
    return rows[0] || null;
  },

  // --- Join Requests (T-16 | Tuna Öcal) ---

  // Create a join request
  async createJoinRequest({ groupReservationId, userId, playerCount }) {
    const [result] = await pool.execute(
      `INSERT INTO join_requests (group_reservation_id, user_id, player_count)
       VALUES (?, ?, ?)`,
      [groupReservationId, userId, playerCount]
    );
    return {
      id: result.insertId,
      groupReservationId,
      userId,
      playerCount,
      status: 'pending',
    };
  },

  // Check if a user already has a pending/approved request for this group
  async findJoinRequest(groupReservationId, userId) {
    const [rows] = await pool.execute(
      `SELECT id, status, player_count AS playerCount
       FROM join_requests
       WHERE group_reservation_id = ? AND user_id = ? AND status IN ('pending', 'approved')`,
      [groupReservationId, userId]
    );
    return rows[0] || null;
  },

  // List join requests for a group
  async findJoinRequestsByGroup(groupReservationId) {
    const [rows] = await pool.execute(
      `SELECT jr.id, jr.user_id AS userId, u.username, jr.player_count AS playerCount,
              jr.status, jr.created_at,
              lr.id AS leaveRequestId, lr.status AS leaveStatus
       FROM join_requests jr
       JOIN users u ON u.id = jr.user_id
       LEFT JOIN leave_requests lr
         ON lr.group_reservation_id = jr.group_reservation_id
        AND lr.user_id = jr.user_id
        AND lr.status = 'pending'
       WHERE jr.group_reservation_id = ?
       ORDER BY jr.created_at ASC`,
      [groupReservationId]
    );
    return rows;
  },

  // Approve a join request and increment group's current_count
  async approveJoinRequest(requestId, groupId) {
    const [rows] = await pool.execute(
      `SELECT jr.id, jr.user_id AS userId, jr.player_count AS playerCount, jr.status,
              gr.party_size AS partySize, gr.current_count AS currentCount,
              gr.status AS groupStatus
       FROM join_requests jr
       JOIN group_reservations gr ON gr.id = jr.group_reservation_id
       WHERE jr.id = ? AND jr.group_reservation_id = ?`,
      [requestId, groupId]
    );
    const req = rows[0];
    if (!req) return null;
    if (req.status !== 'pending') return { error: 'Request is not pending.' };
    if (req.groupStatus !== 'open') return { error: 'Group is no longer open.' };
    const newCount = req.currentCount + req.playerCount;
    if (newCount > req.partySize) return { error: 'Not enough spots for this request.' };

    await pool.execute(`UPDATE join_requests SET status = 'approved' WHERE id = ?`, [requestId]);
    const newStatus = await GroupReservation.updateCount(groupId, newCount, req.partySize);
    return { success: true, requestUserId: req.userId, groupFull: newStatus === 'closed' };
  },

  // Reject a join request
  async rejectJoinRequest(requestId, groupId) {
    const [rows] = await pool.execute(
      `SELECT id, user_id AS userId, status FROM join_requests WHERE id = ? AND group_reservation_id = ?`,
      [requestId, groupId]
    );
    if (!rows[0]) return null;
    if (rows[0].status !== 'pending') return { error: 'Request is not pending.' };
    await pool.execute(`UPDATE join_requests SET status = 'rejected' WHERE id = ?`, [requestId]);
    return { success: true, requestUserId: rows[0].userId };
  },

  async createLeaveRequest({ groupReservationId, userId }) {
    const membership = await GroupReservation.findApprovedMembership(groupReservationId, userId);
    if (!membership) return null;

    const [existing] = await pool.execute(
      `SELECT id, status FROM leave_requests
       WHERE group_reservation_id = ? AND user_id = ? AND status = 'pending'`,
      [groupReservationId, userId]
    );
    if (existing[0]) return { error: 'Leave request is already pending.' };

    const [result] = await pool.execute(
      `INSERT INTO leave_requests (group_reservation_id, user_id, player_count)
       VALUES (?, ?, ?)`,
      [groupReservationId, userId, membership.playerCount]
    );

    return {
      id: result.insertId,
      groupReservationId,
      userId,
      playerCount: membership.playerCount,
      status: 'pending',
    };
  },

  async findLeaveRequestsByGroup(groupReservationId) {
    const [rows] = await pool.execute(
      `SELECT lr.id, lr.user_id AS userId, u.username, lr.player_count AS playerCount,
              lr.status, lr.created_at
       FROM leave_requests lr
       JOIN users u ON u.id = lr.user_id
       WHERE lr.group_reservation_id = ?
       ORDER BY lr.created_at ASC`,
      [groupReservationId]
    );
    return rows;
  },

  async approveLeaveRequest(requestId, groupId) {
    const [rows] = await pool.execute(
      `SELECT lr.id, lr.user_id AS userId, lr.player_count AS playerCount, lr.status,
              gr.party_size AS partySize, gr.current_count AS currentCount
       FROM leave_requests lr
       JOIN group_reservations gr ON gr.id = lr.group_reservation_id
       WHERE lr.id = ? AND lr.group_reservation_id = ?`,
      [requestId, groupId]
    );

    const req = rows[0];
    if (!req) return null;
    if (req.status !== 'pending') return { error: 'Leave request is not pending.' };

    const membership = await GroupReservation.findApprovedMembership(groupId, req.userId);
    if (!membership) return { error: 'User is no longer an active member.' };

    const newCount = Math.max(0, req.currentCount - membership.playerCount);
    await pool.execute(`UPDATE leave_requests SET status = 'approved' WHERE id = ?`, [requestId]);
    await pool.execute(
      `UPDATE join_requests SET status = 'left'
       WHERE group_reservation_id = ? AND user_id = ? AND status = 'approved'`,
      [groupId, req.userId]
    );
    await GroupReservation.updateCount(groupId, newCount, req.partySize);
    return { success: true, requestUserId: req.userId };
  },

  async rejectLeaveRequest(requestId, groupId) {
    const [rows] = await pool.execute(
      `SELECT id, user_id AS userId, status
       FROM leave_requests
       WHERE id = ? AND group_reservation_id = ?`,
      [requestId, groupId]
    );
    if (!rows[0]) return null;
    if (rows[0].status !== 'pending') return { error: 'Leave request is not pending.' };
    await pool.execute(`UPDATE leave_requests SET status = 'rejected' WHERE id = ?`, [requestId]);
    return { success: true, requestUserId: rows[0].userId };
  },

  async removeMember(groupId, userId) {
    const group = await GroupReservation.findById(groupId);
    if (!group) return null;

    const membership = await GroupReservation.findApprovedMembership(groupId, userId);
    if (!membership) return { error: 'User is not an active member.' };

    const newCount = Math.max(0, group.currentCount - membership.playerCount);
    await pool.execute(
      `UPDATE join_requests SET status = 'removed'
       WHERE group_reservation_id = ? AND user_id = ? AND status = 'approved'`,
      [groupId, userId]
    );
    await pool.execute(
      `UPDATE leave_requests SET status = 'rejected'
       WHERE group_reservation_id = ? AND user_id = ? AND status = 'pending'`,
      [groupId, userId]
    );
    await GroupReservation.updateCount(groupId, newCount, group.partySize);

    return { success: true, removedUserId: userId };
  },

  // Get user IDs of all pending/approved members (for group-cancelled notifications)
  async findActiveMembers(groupId) {
    const [rows] = await pool.execute(
      `SELECT DISTINCT user_id AS userId FROM join_requests
       WHERE group_reservation_id = ? AND status IN ('pending', 'approved')`,
      [groupId]
    );
    return rows.map(r => r.userId);
  },

  // Get all join requests made by a specific user (with group info)
  async findRequestsByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT jr.id, jr.group_reservation_id AS groupId, jr.player_count AS playerCount,
              jr.status, jr.created_at,
              lr.id AS leaveRequestId, lr.status AS leaveStatus,
              gr.reservation_name AS groupName,
              DATE_FORMAT(gr.reservation_date, '%Y-%m-%d') AS date,
              TIME_FORMAT(gr.start_time, '%H:%i') AS startTime
       FROM join_requests jr
       JOIN group_reservations gr ON gr.id = jr.group_reservation_id
       LEFT JOIN leave_requests lr
         ON lr.group_reservation_id = jr.group_reservation_id
        AND lr.user_id = jr.user_id
        AND lr.status = 'pending'
       WHERE jr.user_id = ? AND jr.status IN ('pending', 'approved')
       ORDER BY jr.created_at DESC`,
      [userId]
    );
    return rows;
  },
};

module.exports = GroupReservation;
