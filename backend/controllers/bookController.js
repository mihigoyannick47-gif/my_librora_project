const db = require('../config/db');

function buildBookQuery(filters = {}) {
  const { search, category, availability, sort } = filters;
  let query = `
    SELECT b.book_id, b.title, b.ISBN, b.description, b.publisher, b.publication_year, b.cover_image,
           a.author_name, c.category_name,
           COUNT(bc.copy_id) AS total_copies,
           SUM(CASE WHEN bc.status = 'available' THEN 1 ELSE 0 END) AS available_copies
    FROM books b
    INNER JOIN authors a ON a.author_id = b.author_id
    INNER JOIN categories c ON c.category_id = b.category_id
    LEFT JOIN book_copies bc ON bc.book_id = b.book_id
    WHERE 1 = 1`;

  const params = [];

  if (search) {
    query += ' AND (b.title LIKE ? OR a.author_name LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term);
  }

  if (category) {
    query += ' AND c.category_id = ?';
    params.push(Number(category));
  }

  if (availability === 'available') {
    query += ' AND bc.status = "available"';
  }

  if (availability === 'unavailable') {
    query += ' AND (bc.status IS NULL OR bc.status != "available")';
  }

  query += ' GROUP BY b.book_id';

  if (sort === 'title_asc') {
    query += ' ORDER BY b.title ASC';
  } else if (sort === 'title_desc') {
    query += ' ORDER BY b.title DESC';
  } else if (sort === 'newest') {
    query += ' ORDER BY b.created_at DESC';
  } else {
    query += ' ORDER BY b.title ASC';
  }

  return { query, params };
}

async function getBooks(req, res) {
  try {
    const { query, params } = buildBookQuery(req.query);
    const [rows] = await db.query(query, params);

    return res.json({
      count: rows.length,
      books: rows.map(book => ({
        ...book,
        available_copies: Number(book.available_copies || 0),
        total_copies: Number(book.total_copies || 0),
        is_available: Number(book.available_copies || 0) > 0
      }))
    });
  } catch (error) {
    console.error('Get books error:', error);
    return res.status(500).json({ message: 'Could not fetch books.', error: error.message });
  }
}

async function getBookById(req, res) {
  try {
    const { id } = req.params;
    const [bookRows] = await db.query(`
      SELECT b.*, a.author_name, c.category_name,
             (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.book_id) AS total_copies,
             (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.book_id AND bc.status = 'available') AS available_copies
      FROM books b
      INNER JOIN authors a ON a.author_id = b.author_id
      INNER JOIN categories c ON c.category_id = b.category_id
      WHERE b.book_id = ?
    `, [id]);

    if (!bookRows.length) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const book = bookRows[0];
    const [reviewRows] = await db.query(`
      SELECT r.*, u.full_name
      FROM reviews r
      INNER JOIN users u ON u.user_id = r.user_id
      WHERE r.book_id = ?
      ORDER BY r.created_at DESC
    `, [id]);

    const [copyRows] = await db.query(`
      SELECT copy_id, barcode, shelf_location, status
      FROM book_copies
      WHERE book_id = ?
      ORDER BY status ASC, copy_id ASC
    `, [id]);

    return res.json({
      ...book,
      available_copies: Number(book.available_copies || 0),
      total_copies: Number(book.total_copies || 0),
      copies: copyRows,
      reviews: reviewRows
    });
  } catch (error) {
    console.error('Get book by id error:', error);
    return res.status(500).json({ message: 'Could not fetch book details.', error: error.message });
  }
}

async function getCategories(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY category_name ASC');
    return res.json(rows);
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ message: 'Could not fetch categories.' });
  }
}

async function getAuthors(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM authors ORDER BY author_name ASC');
    return res.json(rows);
  } catch (error) {
    console.error('Get authors error:', error);
    return res.status(500).json({ message: 'Could not fetch authors.' });
  }
}

module.exports = {
  getBooks,
  getBookById,
  getCategories,
  getAuthors
};
