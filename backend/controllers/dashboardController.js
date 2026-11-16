const db = require('../config/db');

async function getMemberDashboard(req, res) {
  try {
    const userId = req.user.user_id;

    const [stats] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM borrowings WHERE user_id = ? AND status = 'borrowed') AS currently_borrowed,
        (SELECT COUNT(*) FROM borrowings WHERE user_id = ? AND status = 'returned') AS returned_books,
        (SELECT COUNT(*) FROM reservations WHERE user_id = ? AND status = 'pending') AS pending_reservations,
        (SELECT COUNT(*) FROM borrowings b INNER JOIN book_copies bc ON bc.copy_id = b.copy_id WHERE b.user_id = ? AND b.status = 'overdue') AS overdue_books
    `, [userId, userId, userId, userId]);

    const [recentBorrowings] = await db.query(`
      SELECT b.borrowing_id, bk.title, a.author_name, b.borrow_date, b.due_date, b.status
      FROM borrowings b
      INNER JOIN book_copies bc ON bc.copy_id = b.copy_id
      INNER JOIN books bk ON bk.book_id = bc.book_id
      INNER JOIN authors a ON a.author_id = bk.author_id
      WHERE b.user_id = ?
      ORDER BY b.borrow_date DESC
      LIMIT 5
    `, [userId]);

    return res.json({ stats: stats[0], recentBorrowings });
  } catch (error) {
    console.error('Member dashboard error:', error);
    return res.status(500).json({ message: 'Could not fetch member dashboard data.' });
  }
}

async function getAdminDashboard(req, res) {
  try {
    const [stats] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'member') AS total_members,
        (SELECT COUNT(*) FROM books) AS total_books,
        (SELECT COUNT(*) FROM book_copies) AS total_copies,
        (SELECT COUNT(*) FROM book_copies WHERE status = 'available') AS available_copies,
        (SELECT COUNT(*) FROM book_copies WHERE status = 'borrowed') AS borrowed_copies,
        (SELECT COUNT(*) FROM borrowings WHERE status = 'returned') AS returned_books,
        (SELECT COUNT(*) FROM borrowings WHERE status = 'overdue') AS overdue_books,
        (SELECT COUNT(*) FROM reservations WHERE status = 'pending') AS pending_reservations,
        (SELECT COALESCE(SUM(amount), 0) FROM fines WHERE payment_status = 'unpaid') AS total_unpaid_fines
    `);

    return res.json({ stats: stats[0] });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ message: 'Could not fetch admin dashboard data.' });
  }
}

module.exports = {
  getMemberDashboard,
  getAdminDashboard
};
