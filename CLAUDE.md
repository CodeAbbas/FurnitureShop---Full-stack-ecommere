# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack furniture e-commerce application with three subprojects:
- **`backend/`** — Python Flask REST API (port 5000)
- **`selection-angular/`** — Angular 21 SPA frontend (port 4200)
- **`selection-furniture/product-admin/`** — Legacy Express.js admin panel (port 3000)

The Angular frontend currently reads from a local static JSON (`assets/products.json`) rather than calling the Flask API — the integration is in progress.

## Running the Project

**Prerequisites:** MongoDB running on `localhost:27017`, Python 3.8+, Node.js.

**Database initialization (run once):**
```bash
cd backend
python dummydata.py   # generates data.json with 100 sample products
python push_data.py   # loads products into MongoDB, creates test users
```

**Start backend:**
```bash
cd backend
python app.py         # http://localhost:5000
```

**Start Angular frontend:**
```bash
cd selection-angular
npm start             # http://localhost:4200
```

**Start admin panel (optional):**
```bash
cd selection-furniture/product-admin
npm start             # http://localhost:3000
```

## Development Commands

### Angular (`selection-angular/`)
```bash
npm start             # dev server with hot reload
npm run build         # production build
npm test              # unit tests (Vitest)
npm run watch         # watch mode build
```

### Flask backend (`backend/`)
```bash
python app.py         # run with debug mode enabled
```

### Admin panel (`selection-furniture/product-admin/`)
```bash
npm start             # starts Express server
```

## Architecture

### Backend (Flask)

`app.py` registers four blueprints:

| Blueprint | Module | Route Prefix |
|-----------|--------|-------------|
| Products | `blueprints/products/products.py` | `/api/v1.0/` |
| Auth | `blueprints/auth/auth.py` | `/api/v1.0/guest/` |
| Cart | `blueprints/cart/cart.py` | `/api/v1.0/user/cart` |
| Orders | `blueprints/orders/orders.py` | `/api/v1.0/user/` and `/api/v1.0/admin/` |

**Route pattern by access level:**
- `/api/v1.0/guest/` — public (no auth)
- `/api/v1.0/user/` — requires JWT (`x-access-token` header)
- `/api/v1.0/admin/` — requires JWT + `admin: true` on user document

**Auth decorators** are in `decorators.py`: `@jwt_required` and `@admin_required`. Tokens expire in 2 hours. Logout blacklists the token in the `blacklist` collection.

**Global config** (`globals.py`): MongoDB connection string, database name (`selectionDB`), JWT secret key.

### MongoDB Collections

- **products** — catalog items with embedded `reviews[]` and `variations[]`
- **users** — accounts with `admin` boolean flag and `cart[]` array
- **orders** — order documents with `status` field managed by admin
- **blacklist** — invalidated JWT tokens

**Test credentials** (created by `push_data.py`):
- Admin: `admin@selection.com` / `admin123`
- Customer: `customer@selection.com` / `customer123`

### Angular Frontend

Main service: `src/app/services/selection-service.ts` — currently loads products from `src/app/assets/products.json`. When wiring to the backend, all product and user API calls go through this service.

Pages: `catalog`, `cart`, `product-detail`, `home` under `src/app/pages/`.

Styling: Bootstrap 5 (included in `angular.json` styles) plus Tailwind CSS 4.

### Admin Panel (Express.js)

Standalone file-upload server at `selection-furniture/product-admin/server.js`. Accepts multipart form posts at `POST /upload/product` (up to 10 images via Multer), stores product data in `products.json`, and serves uploads as static files. Not connected to the Flask API or MongoDB.
