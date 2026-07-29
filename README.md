# Knotoria — Handmade Crochet Shop

A full-stack e-commerce site for a crochet shop, built with:

- **Frontend:** React.js + Tailwind CSS (Vite)
- **Backend:** Node.js + Express (REST API)
- **Database:** SQLite, using Node's built-in `node:sqlite` module — no separate database
  server to install, no native compilation. Requires **Node.js 22.5+**.
- **Auth:** JWT-based login for the admin dashboard

## Project structure

```
knotoria/
├── server/              Express API + SQLite database
│   ├── db/
│   │   ├── database.js  Schema + connection
│   │   └── seed.js      Sample categories & products
│   ├── routes/
│   │   ├── auth.js       POST /api/auth/login
│   │   ├── products.js   GET/POST/PATCH/DELETE /api/products
│   │   └── categories.js GET/POST/DELETE /api/categories
│   ├── middleware/auth.js  JWT verification
│   ├── index.js          Server entry point
│   └── .env.example
└── client/               React + Tailwind storefront + admin dashboard
    └── src/
        ├── pages/         Home, Shop, About, Contact, AdminLogin, AdminDashboard
        ├── components/    Navbar, Footer, HeroCarousel, ProductCard, CategoryCard...
        └── context/        AuthContext (admin session)
```

## Getting started

### 1. Check your Node version

```bash
node --version   # must be 22.5.0 or higher (for built-in node:sqlite)
```

If you're on an older Node version, install Node 22+ from nodejs.org or via nvm:
```bash
nvm install 22
nvm use 22
```

### 2. Set up and run the backend

```bash
cd server
cp .env.example .env       # then edit .env if you want a different admin password
npm install
npm run seed                # creates the database file + sample products
npm start                   # runs on http://localhost:4000
```

The first time the server starts, it also auto-creates a default admin user if none
exists, using `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env` (defaults to
`admin` / `knotoria123` — **change this in `.env` before going live**).

### 3. Set up and run the frontend

In a separate terminal:

```bash
cd client
npm install
npm run dev                 # runs on http://localhost:5173
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` requests to
the Express server on port 4000 automatically (see `client/vite.config.js`).

### 4. Log in to the admin dashboard

Go to **http://localhost:5173/admin/login** and sign in with the admin credentials
from `server/.env`. From there you can:

- **Add a new item** — fill in name, category, price, stock count, image URL, and
  description.
- **Update stock** — edit the stock number directly in the inventory table; it
  automatically flips the item to "Out of stock" when it hits 0.
- **Remove an item** — click "Remove" to delete it from the shop entirely.

## Product images

The seed data uses Unsplash photo URLs as placeholders so the shop looks fully
populated out of the box. Swap these for your own product photography by:
- Editing `image_url` directly in the admin dashboard for any product, or
- Replacing the URLs in `server/db/seed.js` before running `npm run seed`.

## API reference

| Method | Endpoint              | Auth required | Description                       |
|--------|-----------------------|----------------|------------------------------------|
| GET    | `/api/health`          | No             | Health check                       |
| GET    | `/api/categories`      | No             | List all categories                |
| POST   | `/api/categories`      | Yes            | Create a category                  |
| DELETE | `/api/categories/:id`  | Yes            | Delete a category                  |
| GET    | `/api/products`        | No             | List products (`?category=slug`, `?inStockOnly=true`) |
| GET    | `/api/products/:id`    | No             | Get a single product               |
| POST   | `/api/products`        | Yes            | Add a new product                  |
| PATCH  | `/api/products/:id`    | Yes            | Update a product (e.g. stock count)|
| DELETE | `/api/products/:id`    | Yes            | Remove a product                   |
| POST   | `/api/auth/login`      | No             | Admin login, returns a JWT         |

Authenticated requests need a header: `Authorization: Bearer <token>`.

## Notes on the design

The visual identity is built around a warm, fiber-craft palette (terracotta clay,
sage thread green, oat and cream neutrals) with `Fraunces` for display type and
`Inter` for body text. The recurring "stitch-loop" divider (a hand-drawn chain
stitch SVG) stands in for plain hairline rules throughout the site, tying back to
crochet's core stitch.

## Next steps you might want

- Wire the "Add to Cart" buttons to an actual cart + checkout flow
- Connect the Contact form to a real email service (e.g. via a backend route)
- Deploy: the backend works on any Node 22+ host (Render, Railway, Fly.io); the
  frontend builds to static files (`npm run build` in `client/`) deployable to
  Netlify, Vercel, or any static host — just update the API base URL for
  production.
