const API_BASE = 'http://localhost:5000/api';
let catalogBooks = [];

const defaultBookImage = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#1d2d3d"/>
      <stop offset="100%" stop-color="#c9a66b"/>
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="#f7f2ea"/>
  <rect x="60" y="60" width="480" height="780" rx="28" fill="url(#g)"/>
  <circle cx="300" cy="250" r="120" fill="rgba(255,255,255,0.12)"/>
  <path d="M180 620 L420 620" stroke="rgba(255,255,255,0.5)" stroke-width="18" stroke-linecap="round"/>
  <path d="M180 690 L390 690" stroke="rgba(255,255,255,0.5)" stroke-width="18" stroke-linecap="round"/>
  <text x="300" y="430" text-anchor="middle" fill="white" font-size="42" font-family="Georgia, serif" font-weight="700">LIBRORA</text>
</svg>
`);

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createBookImage(book, className) {
  const image = makeElement('img', className);
  image.src = book.cover_image || defaultBookImage;
  image.alt = `${book.title} cover`;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.onerror = () => {
    image.onerror = null;
    image.src = defaultBookImage;
  };
  return image;
}

function bookAvailability(book) {
  const total = Number(book.total_copies || 0);
  const available = Number(book.available_copies || 0);

  if (total === 0) return { available, total, label: 'No copies listed' };
  if (available === 0) return { available, total, label: 'Currently borrowed' };
  return { available, total, label: `${available} of ${total} available` };
}

function createBookCard(book) {
  const card = document.createElement('article');
  card.className = 'book-card';

  const availability = bookAvailability(book);
  const cover = makeElement('div', 'book-cover-wrap');
  cover.appendChild(createBookImage(book));
  cover.appendChild(makeElement(
    'span',
    `status-chip ${availability.available === 0 ? 'unavailable' : ''}`,
    availability.label
  ));

  const info = makeElement('div', 'book-info');
  const category = makeElement('div', 'meta-row');
  category.append(
    makeElement('span', '', book.category_name || 'General'),
    makeElement('span', '', book.publication_year || 'Year not listed')
  );
  info.append(category, makeElement('h3', '', book.title));

  const author = makeElement('div', 'meta-row');
  author.append(
    makeElement('span', '', book.author_name || 'Unknown author'),
    makeElement('span', '', `${availability.available}/${availability.total} copies`)
  );
  info.append(
    author,
    makeElement('p', 'book-description', book.description || 'No description available yet.')
  );

  const actions = makeElement('div', 'book-actions');
  const detailsLink = makeElement('a', 'link-btn', 'View book details');
  detailsLink.href = `details.html?id=${encodeURIComponent(book.book_id)}`;
  detailsLink.setAttribute('aria-label', `View details for ${book.title}`);
  actions.appendChild(detailsLink);
  info.appendChild(actions);

  card.append(cover, info);

  return card;
}

function renderBookList(container, books, emptyMessage) {
  if (!container) return;

  if (!books.length) {
    container.replaceChildren(makeElement('p', 'muted', emptyMessage));
    return;
  }

  container.replaceChildren(...books.map(createBookCard));
}

function renderCatalog() {
  const search = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const category = document.getElementById('categoryFilter')?.value || '';
  const availability = document.getElementById('availabilityFilter')?.value || '';

  const filteredBooks = catalogBooks.filter((book) => {
    const matchesSearch = !search
      || `${book.title} ${book.author_name}`.toLowerCase().includes(search);
    const matchesCategory = !category || String(book.category_id) === category;
    const availableCopies = Number(book.available_copies || 0);
    const matchesAvailability = !availability
      || (availability === 'available' ? availableCopies > 0 : availableCopies === 0);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const count = document.getElementById('catalogResultCount');
  if (count) {
    count.textContent = `Showing ${filteredBooks.length} of ${catalogBooks.length} books`;
  }

  renderBookList(
    document.getElementById('bookGrid'),
    filteredBooks,
    'No books match these filters. Try changing your search.'
  );
}

function populateCategories(books) {
  const select = document.getElementById('categoryFilter');
  if (!select) return;

  const categoryNames = new Map(
    books.map((book) => [String(book.category_id), book.category_name || 'General'])
  );
  const allCategories = makeElement('option', '', 'All categories');
  allCategories.value = '';
  select.replaceChildren(allCategories);

  [...categoryNames.entries()]
    .sort((first, second) => first[1].localeCompare(second[1]))
    .forEach(([id, name]) => {
      const option = makeElement('option', '', name);
      option.value = id;
      select.appendChild(option);
    });
}

async function loadBundledBooks() {
  let lastError;

  for (const path of ['/data/books.json', 'data/books.json']) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Bundled catalog request failed (${response.status}).`);

      const books = await response.json();
      if (!Array.isArray(books)) throw new Error('Bundled catalog has an invalid format.');
      return books;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Bundled catalog is unavailable.');
}

async function loadBooks() {
  const catalog = document.getElementById('bookGrid');
  const featured = document.getElementById('featuredBookGrid');
  if (!catalog && !featured) return;

  let usingSampleCatalog = false;

  try {
    const response = await fetch(`${API_BASE}/books`);
    if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);

    const data = await response.json();
    catalogBooks = Array.isArray(data.books) ? data.books : [];
    if (!catalogBooks.length) usingSampleCatalog = true;
  } catch (error) {
    console.warn('Live catalog unavailable; loading bundled sample catalog:', error);
    usingSampleCatalog = true;
  }

  if (usingSampleCatalog) {
    try {
      catalogBooks = await loadBundledBooks();
    } catch (error) {
      console.error('Load bundled catalog error:', error);
      const message = 'The catalog could not load. Start the app from the project folder and check that frontend/data/books.json exists.';
      renderBookList(catalog, [], message);
      renderBookList(featured, [], message);
      const count = document.getElementById('catalogResultCount');
      if (count) count.textContent = 'Catalog unavailable';
      return;
    }
  }

  populateCategories(catalogBooks);
  renderBookList(
    featured,
    catalogBooks.slice(0, 6),
    'No books are listed yet. Add books to the catalog to feature them here.'
  );
  renderCatalog();

  const sourceNote = document.getElementById('catalogSourceNote');
  if (sourceNote && usingSampleCatalog) {
    sourceNote.textContent = 'Showing the bundled sample catalog. Availability is sample data until the database is connected.';
  }
}

function appendDetailField(container, label, value) {
  const row = makeElement('p');
  const displayValue = value === null || value === undefined || value === ''
    ? 'Not specified'
    : value;
  row.append(makeElement('strong', '', `${label}: `), document.createTextNode(displayValue));
  container.appendChild(row);
}

async function loadBookDetails() {
  const root = document.getElementById('bookDetails');
  if (!root) return;

  root.textContent = 'Loading book details…';
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    root.textContent = 'Book not found.';
    return;
  }

  let book;
  try {
    const response = await fetch(`${API_BASE}/books/${id}`);
    if (response.ok) {
      book = await response.json();
    } else {
      console.warn(`Book details API returned ${response.status}; checking bundled sample catalog.`);
    }
  } catch (error) {
    console.warn('Book details API unavailable; checking bundled sample catalog:', error);
  }

  if (!book) {
    try {
      const bundledBooks = await loadBundledBooks();
      book = bundledBooks.find((item) => String(item.book_id) === id);
    } catch (error) {
      console.error('Load bundled book details error:', error);
    }
  }

  if (!book) {
    root.textContent = 'Book not found, or the catalog could not be loaded.';
    return;
  }

  try {
    const availability = bookAvailability(book);
    const detailCard = makeElement('div', 'detail-card');
    const cover = makeElement('div', 'detail-cover');
    cover.appendChild(createBookImage(book));

    const copy = makeElement('div', 'detail-copy');
    copy.append(
      makeElement('span', 'pill', book.category_name || 'General'),
      makeElement('h1', '', book.title)
    );
    appendDetailField(copy, 'Author', book.author_name);
    appendDetailField(copy, 'Publisher', book.publisher);
    appendDetailField(copy, 'Publication year', book.publication_year);
    appendDetailField(copy, 'ISBN', book.ISBN);
    appendDetailField(copy, 'Total copies', availability.total);

    const availabilityPanel = makeElement(
      'div',
      `availability-panel ${availability.available === 0 ? 'unavailable' : ''}`
    );
    availabilityPanel.append(
      makeElement('strong', '', availability.label),
      makeElement(
        'p',
        '',
        availability.available > 0
          ? 'This title has copies currently available.'
          : availability.total > 0
            ? 'All listed copies are currently borrowed or unavailable.'
            : 'No copies have been added to the inventory yet.'
      )
    );
    copy.appendChild(availabilityPanel);

    const shelfLocations = [...new Set(
      (book.copies || [])
        .filter((bookCopy) => bookCopy.status === 'available' && bookCopy.shelf_location)
        .map((bookCopy) => bookCopy.shelf_location)
    )];
    if (shelfLocations.length) {
      appendDetailField(copy, 'Available at', shelfLocations.join(', '));
    }

    copy.append(
      makeElement('h2', '', 'About this book'),
      makeElement('p', 'detail-description', book.description || 'No description available yet.')
    );

    const backLink = makeElement('a', 'btn btn-secondary detail-back-link', 'Back to all books');
    backLink.href = 'index.html#library';
    copy.appendChild(backLink);
    detailCard.append(cover, copy);
    root.replaceChildren(detailCard);
  } catch (error) {
    console.error('Load book details error:', error);
    root.textContent = 'Unable to load the book details right now. Check that the API is running.';
  }
}

async function registerMember(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    full_name: form.full_name.value,
    email: form.email.value,
    password: form.password.value,
    phone: form.phone ? form.phone.value : '',
    address: form.address ? form.address.value : ''
  };

  const messageBox = document.getElementById('formMessage');

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      messageBox.className = 'alert error show';
      messageBox.textContent = result.message || 'Registration failed.';
      return;
    }

    messageBox.className = 'alert success show';
    messageBox.textContent = 'Registration complete! Redirecting to login...';
    localStorage.setItem('librora_token', result.token);
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
  } catch (error) {
    messageBox.className = 'alert error show';
    messageBox.textContent = 'Unable to register right now.';
  }
}

async function loginMember(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    email: form.email.value,
    password: form.password.value
  };

  const messageBox = document.getElementById('formMessage');

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      messageBox.className = 'alert error show';
      messageBox.textContent = result.message || 'Login failed.';
      return;
    }

    localStorage.setItem('librora_token', result.token);
    localStorage.setItem('librora_user', JSON.stringify(result.user));
    messageBox.className = 'alert success show';
    messageBox.textContent = 'Login successful. Redirecting...';
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (error) {
    messageBox.className = 'alert error show';
    messageBox.textContent = 'Unable to log in right now.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const searchForm = document.getElementById('bookSearchForm');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const availabilityFilter = document.getElementById('availabilityFilter');

  if (registerForm) {
    registerForm.addEventListener('submit', registerMember);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', loginMember);
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      renderCatalog();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderCatalog);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', renderCatalog);
  }

  if (availabilityFilter) {
    availabilityFilter.addEventListener('change', renderCatalog);
  }

  if (document.getElementById('bookGrid') || document.getElementById('featuredBookGrid')) {
    loadBooks();
  }

  if (document.getElementById('bookDetails')) {
    loadBookDetails();
  }
});
