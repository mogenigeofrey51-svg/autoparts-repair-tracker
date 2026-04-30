# AutoParts & Repair Tracker

A full-stack MVP for an e-commerce car parts platform with vehicle and repair tracking.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JWT

## Project Structure

```text
.
|-- client/                 # React app
|   |-- src/
|   |   |-- api/            # API client
|   |   |-- components/     # Shared UI/layout components
|   |   |-- context/        # Auth and cart state
|   |   |-- pages/          # App pages
|   |   `-- types.ts        # Frontend data contracts
|-- server/                 # Express API
|   |-- prisma/
|   |   |-- schema.prisma   # Database schema
|   |   `-- seed.ts         # Sample users, vehicles, products, repairs
|   `-- src/
|       |-- lib/            # Prisma and auth helpers
|       |-- middleware/     # Error handling
|       |-- routes/         # API routes
|       `-- utils/          # Serializers and async helpers
|-- docker-compose.yml      # Local PostgreSQL
`-- .env.example
```

## Backend API Routes

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### User Profile

- `GET /api/users/profile`
- `PATCH /api/users/profile`
- `GET /api/users` admin only

### Vehicles and Repairs

- `GET /api/vehicles`
- `POST /api/vehicles`
- `GET /api/vehicles/:id`
- `PATCH /api/vehicles/:id`
- `DELETE /api/vehicles/:id`
- `GET /api/vehicles/:vehicleId/repairs`
- `POST /api/vehicles/:vehicleId/repairs`
- `PATCH /api/vehicles/repairs/:id`
- `DELETE /api/vehicles/repairs/:id`

### Catalog, Cart, and Orders

- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/cart`
- `POST /api/cart`
- `PATCH /api/cart/:id`
- `DELETE /api/cart/:id`
- `DELETE /api/cart`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`

### Admin

- `GET /api/admin/users`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `GET /api/admin/vehicles`
- `GET /api/admin/repairs`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `POST /api/admin/categories`
- `PATCH /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`

## Database Schema

The Prisma schema is in `server/prisma/schema.prisma` and includes:

- `User`: account, profile, role, vehicles, cart, and orders
- `Vehicle`: make, model, year, plate, VIN, engine number, mileage, fuel, transmission, notes
- `RepairRecord`: repair timeline entries, parts used, cost, mechanic, receipt placeholder, next service date
- `Category` and `Product`: catalog organization, stock, pricing, and compatibility arrays
- `CartItem`, `Order`, and `OrderItem`: cart state plus order snapshots for stable order history

## Frontend Pages and Components

- `AuthPage`: sign up and login
- `DashboardPage`: vehicle, repair, cart, and order summary
- `VehiclesPage`: vehicle CRUD and per-vehicle repair timeline
- `CatalogPage` and `ProductDetailPage`: search, filters, details, and add to cart
- `CartPage`: quantity management and checkout placeholder
- `OrdersPage`: order history
- `ProfilePage`: profile editing
- `AdminPage`: product/category management and admin oversight
- Shared components: `Layout`, `PageHeader`, `ProductCard`, `StatCard`, `EmptyState`

## Authentication Flow

1. A user signs up or logs in through `POST /api/auth/signup` or `POST /api/auth/login`.
2. The API hashes passwords with bcrypt and returns a JWT containing `userId` and `role`.
3. The client stores the token in local storage and sends it as `Authorization: Bearer <token>`.
4. Protected routes use the auth middleware to verify the token.
5. Admin routes additionally require `role = ADMIN`.

## Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment files:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item server/.env.example server/.env
   Copy-Item client/.env.example client/.env
   ```

3. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

4. Generate Prisma client and run the migration:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Seed sample data:

   ```bash
   npm run db:seed
   ```

6. Start both apps:

   ```bash
   npm run dev
   ```

The client runs at `http://localhost:5173` and the API runs at `http://localhost:4000/api`.

## Deploy Online With Render and Neon

The recommended MVP deployment is a single Render web service plus a hosted Neon Postgres database. In production, the Express server serves the built React app and the API from the same domain.

1. Create a Neon Postgres project and copy both connection strings:

   - `DATABASE_URL`: pooled connection string
   - `DIRECT_URL`: direct connection string

2. Push this folder to a GitHub repository.

3. In Render, create a new Blueprint from the GitHub repository.

   Render will detect `render.yaml` and create the web service with:

   - Build command: `npm install --include=dev && npm run db:generate && npm run db:deploy && npm run build`
   - Start command: `npm run start -w server`
   - Runtime: Node

4. Add the required environment variable in Render:

   ```env
   DATABASE_URL=your-neon-pooled-postgres-url
   DIRECT_URL=your-neon-direct-postgres-url
   ```

   `JWT_SECRET` is generated by Render from `render.yaml`. `PORT` is provided by Render. `VITE_API_URL` is not needed because the client uses `/api` on the same domain.

5. After the first deploy, seed sample data once from your machine by temporarily setting `server/.env` to the Neon connection strings, then running:

   ```bash
   npm run db:seed
   ```

   Do not add the seed command to the Render build command, or every deploy can reset sample customer data.

## Seed Accounts

- Customer: `customer@autoparts.test` / `password123`
- Admin: `admin@autoparts.test` / `admin12345`

## Future Extension Points

- Payments: add a payment provider service around `Order` creation.
- Mechanic bookings: add `Mechanic`, `Garage`, and `Booking` models connected to `Vehicle`.
- Spare-part compatibility matching: replace the current make/model/year arrays with a normalized compatibility table.
- File uploads: replace the receipt URL placeholder with object storage and signed upload URLs.
