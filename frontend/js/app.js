const API_BASE = 'http://localhost:5000/api';

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

function createBookCard(book) {
  const card = document.createElement('article');
  card.className = 'book-card';

  const available = Number(book.available_copies || 0) > 0;
  const imageUrl = book.cover_image || defaultBookImage;

  card.innerHTML = `
    <div class="book-cover-wrap">
      <img src="${imageUrl}" alt="${book.title}" onerror="this.src='${defaultBookImage}'" />
      <span class="status-chip ${available ? '' : 'unavailable'}">${available ? 'Available' : 'Unavailable'}</span>
    </div>
    <div class="book-info">
      <div class="meta-row">
        <span>${book.category_name || 'General'}</span>
        <span>${book.publication_year || 'N/A'}</span>
      </div>
      <h3>${book.title}</h3>
      <div class="meta-row">
        <span>${book.author_name || 'Unknown author'}</span>
        <span>${book.available_copies || 0} left</span>
      </div>
      <div class="book-actions">
        <button class="btn btn-secondary" type="button">Borrow</button>
        <a href="details.html?id=${book.book_id}" class="link-btn">View Details</a>
      </div>
    </div>
  `;

  return card;
}

async function loadBooks() {
  const container = document.getElementById('bookGrid');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE}/books`);
    const data = await response.json();
    const books = data.books || [];

    container.innerHTML = '';

    if (!books.length) {
      container.innerHTML = '<p class="muted">No books available right now.</p>';
      return;
    }

    books.slice(0, 8).forEach((book) => {
      container.appendChild(createBookCard(book));
    });
  } catch (error) {
    container.innerHTML = '<p class="muted">The library catalog is temporarily unavailable. Please try again later.</p>';
  }
}

async function loadBookDetails() {
  const root = document.getElementById('bookDetails');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    root.innerHTML = '<p>Book not found.</p>';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/books/${id}`);
    const book = await response.json();

    if (!response.ok) {
      root.innerHTML = '<p>Unable to fetch this book.</p>';
      return;
    }

    root.innerHTML = `
      <div class="detail-card">
        <div class="detail-cover">
          <img src="${book.cover_image || defaultBookImage}" alt="${book.title}" onerror="this.src='${defaultBookImage}'" />
        </div>
        <div class="detail-copy">
          <span class="pill">${book.category_name}</span>
          <h1>${book.title}</h1>
          <p><strong>Author:</strong> ${book.author_name}</p>
          <p><strong>Publisher:</strong> ${book.publisher || 'Not specified'}</p>
          <p><strong>Publication year:</strong> ${book.publication_year || 'N/A'}</p>
          <p><strong>ISBN:</strong> ${book.ISBN}</p>
          <p><strong>Available copies:</strong> ${book.available_copies || 0}</p>
          <p><strong>Total copies:</strong> ${book.total_copies || 0}</p>
          <p>${book.description || 'No description available yet.'}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" type="button">Borrow Book</button>
            <button class="btn btn-secondary" type="button">Reserve</button>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    root.innerHTML = '<p>Unable to load the book details right now.</p>';
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

  if (registerForm) {
    registerForm.addEventListener('submit', registerMember);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', loginMember);
  }

  if (document.getElementById('bookGrid')) {
    loadBooks();
  }

  if (document.getElementById('bookDetails')) {
    loadBookDetails();
  }
});
