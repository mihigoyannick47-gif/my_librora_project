const express = require('express');
const { getBooks, getBookById, getCategories, getAuthors } = require('../controllers/bookController');

const router = express.Router();

router.get('/', getBooks);
router.get('/categories', getCategories);
router.get('/authors', getAuthors);
router.get('/:id', getBookById);

module.exports = router;
