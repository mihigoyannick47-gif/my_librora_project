# LIBRORA

LIBRORA is a complete library management system created for the L4 Backend Application Development module.

## Phase 1: Project initialization and database setup

This phase creates the project structure, installs the backend dependencies, and prepares the database schema for a MySQL-based library application.

## Project structure

- `backend/` — Express server, configuration, controllers, models, routes, and utilities
- `database/` — SQL schema and seed files
- `frontend/` — landing page, login, and registration pages
- `uploads/` — uploaded book images and supported files

## Requirements

- Node.js 18+
- MySQL 8+
- npm

## Step 1: Install dependencies

```bash
cd librora
npm install
```

## Step 2: Configure the environment

Copy the example file and update the values to match your local MySQL setup:

```bash
cp .env.example .env
```

Then update the MySQL credentials and JWT secret.

## Step 3: Create the database

Open MySQL and run:

```sql
CREATE DATABASE IF NOT EXISTS librora_db;
```

Then import the schema:

```bash
mysql -u root -p librora_db < database/schema.sql
```

`schema.sql` drops and recreates the project tables. Import it only when setting up a new or empty database; do not re-import it if you need to keep existing data.

Import the starter catalog so the site has books to display immediately. The seed includes 30 sample titles, descriptions, inventory copies, and Open Library ISBN cover links:

```bash
mysql -u root -p librora_db < database/seed.sql
```

The cover images are loaded from Open Library when available; the site shows a built-in fallback cover if a remote image is missing. All 30 seeded titles are listed on the home page with availability and descriptions. A bundled copy of the starter catalog lets the site display the books even when MySQL is not configured; availability shown in that mode is sample data, not live inventory.

## Step 4: Start the API server

```bash
npm run dev
```

The backend will start on port 5000 by default.

## What is included in this phase

- Initialized Node.js project structure
- Installed required dependencies for Express, MySQL, JWT, validation, and security
- Created database schema file with the required tables
- Prepared sample seed file for initial books and collections
- Added environment example configuration

## What remains

The next phases will cover:

1. Authentication and authorization
2. Book, author, and category APIs
3. Borrowing, reservations, returns, and fines
4. Frontend pages and dashboards
5. Final testing and bug fixing

## Developer notes

This project is built to separate concerns clearly:

- `backend/config` stores connection settings
- `backend/routes` contains API endpoints
- `backend/controllers` handles business logic
- `database/schema.sql` defines the relational structure
- `database/seed.sql` populates starting library data

The application follows the structure requested for the LIBRORA project and is ready to be expanded in the next phases.
