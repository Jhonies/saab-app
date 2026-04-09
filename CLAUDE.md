# CLAUDE.md — SAAB Gestao Logistica

## Project Overview

Sistema de gestao para distribuidora de carnes, bebidas e acessorios para churrasco, baseada em Orlando, FL (EUA).
Moeda: **USD ($)**. Localizacao: **Orlando, Florida**.
Fluxo operacional: **Vendedor faz pedido (digita nome da loja) -> Expedicao confirma, separa e insere pesos -> Motorista carrega e entrega -> Admin monitoriza tudo.**

> **Nota**: O CLIENTE nao faz mais parte do fluxo. O vendedor digita o nome da loja diretamente no pedido. O campo `clientName` substitui o `clientId` do User.

## Tech Stack

| Camada    | Stack                                       |
|-----------|---------------------------------------------|
| Frontend  | React 19, Vite 8, Tailwind CSS 3, react-router-dom 7, axios |
| Backend   | Node.js, Express 5, Prisma ORM 5, PostgreSQL, JWT, Zod 4, pdfkit, bcrypt |
| Infra     | Backend: Railway, DB: Supabase (PostgreSQL), Frontend: Vercel |

## Environment Variables

### Backend (Railway)

| Variable         | Required | Default              | Purpose                        |
|------------------|----------|----------------------|--------------------------------|
| `DATABASE_URL`   | Yes      | —                    | Supabase PostgreSQL connection |
| `JWT_SECRET`     | Yes      | —                    | Token signing (use strong random value) |
| `JWT_EXPIRES_IN` | No       | `8h`                 | Token expiration               |
| `FRONTEND_URL`   | Yes      | `http://localhost:5173` | CORS origin (Vercel URL in prod). Comma-separated for multiple origins |
| `NODE_ENV`       | Recommended | —                 | `production` hides error stack traces |
| `PORT`           | No       | `3000`               | Railway injects automatically  |

### Frontend (Vercel)

| Variable       | Required | Default              | Purpose                  |
|----------------|----------|----------------------|--------------------------|
| `VITE_API_URL` | Yes      | `http://localhost:3000` | Backend URL (Railway URL in prod, no trailing slash). Must be set at **build time** |

## Commands

```bash
# Migrations & Seed
cd backend && npx prisma migrate dev --name <nome>
cd backend && npx prisma db seed

# Dev - Frontend (local)
cd frontend && npm install && npm run dev

# Dev - Backend (local)
cd backend && npm install && npm run dev

# Build (Railway runs this automatically)
cd backend && npx prisma generate && npx prisma migrate deploy
```

## Architecture

```
project/
├── backend/
│   ├── server.js                      # Express entry point, monta todas as rotas + serve frontend build
│   ├── prisma/
│   │   ├── schema.prisma              # User, Product, Container, Order, OrderItem, BoxWeight
│   │   └── seed.js                    # 4 users + ~191 produtos reais + ~240 conteineres
│   └── src/
│       ├── middlewares/authMiddleware.js   # authMiddleware + authorizeRoles
│       ├── controllers/               # HTTP layer - validacao de input, status codes
│       │   ├── AuthController.js      # login (public), register (ADMIN), listUsers (ADMIN)
│       │   ├── InventoryController.js # containers + products CRUD
│       │   ├── OrderController.js     # order lifecycle + invoice PDF
│       │   ├── RouteController.js     # daily route optimization
│       │   └── UserController.js      # user/client CRUD
│       ├── lib/
│       │   ├── prisma.js              # Prisma client singleton (global, all environments)
│       │   └── schemas.js             # Zod schemas - createOrderSchema, packOrderSchema, updateStatusSchema
│       ├── services/                  # Business logic - Prisma queries, calculos
│       │   ├── InventoryService.js    # Container/product operations, referential integrity
│       │   ├── OrderService.js        # Status transitions with lastStatusAt conflict detection
│       │   ├── InvoiceService.js      # PDF generation (pdfkit), warns on missing assets (non-fatal)
│       │   ├── RouteService.js        # Haversine + delivery window sorting, depot Orlando FL
│       │   └── UserService.js         # User CRUD, bcrypt, client creation
│       ├── routes/
│       │   ├── authRoutes.js          # POST /auth/login, POST /auth/register, GET /auth/users
│       │   ├── inventoryRoutes.js     # GET/PATCH /inventory/containers, GET/POST/PATCH/DELETE /inventory/products
│       │   ├── orderRoutes.js         # CRUD + /status /separate /pack /load /deliver /invoice /clients
│       │   ├── routeRoutes.js         # GET /routes/daily
│       │   └── userRoutes.js          # GET/POST/PATCH /users, POST /users/clients
│       └── assets/                    # Invoice fonts + logo (committed to git)
│           ├── helvetica-world-italic.ttf
│           ├── IBMPlexSans-Italic-VariableFont_wdth,wght.ttf
│           └── Logo-do-invoice.png
└── frontend/src/
    ├── main.jsx                       # Entry point, ThemeProvider wrapper
    ├── App.jsx                        # Route definitions + AuthProvider
    ├── context/
    │   ├── AuthContext.jsx            # AuthProvider, useAuth - login, logout, token, user
    │   └── ThemeContext.jsx           # Light/dark theme toggle (data-theme attribute)
    ├── services/
    │   ├── authService.js             # Axios instance + JWT interceptor + 401 redirect
    │   ├── inventoryService.js        # fetchContainers, fetchProducts, fetchAllProducts, createProduct, updateProduct, deleteProduct, fetchProductStock, searchProducts
    │   ├── orderService.js            # fetchOrders, fetchOrderById, createOrder, confirmOrder, separateOrder, packOrder, loadOrder, deliverOrder, openInvoice, fetchClients
    │   ├── routeService.js            # fetchDailyRoute
    │   └── userService.js             # fetchUsers, createUser, updateUser, createClient
    ├── constants/
    │   ├── zones.js                   # ZONE_CONFIG, ZONE_LABELS, SUBZONE_LABELS
    │   └── categories.js             # CATEGORIES (Bovino, Suino, Aves, Miudos, Laticinios, Congelados, Secos, Bebidas, Outros)
    ├── components/
    │   ├── ProtectedRoute.jsx         # Route guard por role JWT
    │   ├── ThemeToggle.jsx            # Light/dark theme switcher
    │   └── Inventory/
    │       ├── InventoryGrid.jsx      # Grid de conteineres por zona com busca e progresso
    │       ├── ContainerEditModal.jsx # Modal edicao de conteiner
    │       └── ProductList.jsx        # Lista de produtos
    └── pages/
        ├── Login.jsx                  # Autenticacao, redireciona por role
        ├── Unauthorized.jsx
        ├── AdminDashboard.jsx         # Layout shell admin (sidebar + topbar + Outlet) + AdminHome (KPIs)
        ├── AdminUsers.jsx             # CRUD utilizadores (modal)
        ├── AdminProducts.jsx          # CRUD produtos (modal, toggle activo/inactivo, precos em $) -- NOT ROUTED
        ├── Inventory.jsx              # Wrapper -> InventoryGrid
        ├── OrderEntry.jsx             # Formulario de pedido com validacao de stock
        ├── Logistics.jsx              # Tabela de pedidos, fatura PDF, mapa (enderecos Orlando FL)
        ├── DriverRoutes.jsx           # Rota optimizada, paradas, link Google Maps
        ├── DriverDelivery.jsx         # Detalhe entrega: carga -> assinatura -> entregue
        ├── ExpedicaoLayout.jsx        # Layout shell expedicao (sidebar + topbar + Outlet)
        ├── ExpedicaoDashboard.jsx     # Contadores por status
        ├── ExpedicaoOrders.jsx        # Fila de trabalho com filtros
        ├── ExpedicaoPickingList.jsx   # Picking list + transicoes de status
        ├── VendedorLayout.jsx         # Layout shell vendedor (topbar + Outlet)
        ├── VendedorOrders.jsx         # Lista de pedidos criados
        └── MotoristaLayout.jsx        # Layout shell motorista (topbar + Outlet)
```

## Roles & Permissions

| Role       | Redirect        | Access |
|------------|-----------------|--------|
| `ADMIN`    | `/admin`        | Dashboard KPIs, inventario, pedidos, logistica, rotas, utilizadores |
| `VENDEDOR` | `/vendedor`    | Criar pedidos, visualizar pedidos |
| `EXPEDICAO`| `/expedicao`    | Dashboard contadores, fila de pedidos, picking list, conteineres, logistica |
| `MOTORISTA`| `/motorista`    | Rota do dia, detalhe de entrega, assinatura digital |

## Order Status Pipeline

```
PENDING -> CONFIRMED -> SEPARATING -> READY -> IN_TRANSIT -> DELIVERED
                 \-> CANCELLED (antes de DELIVERED)
```

| Transition              | Who              | Endpoint                  |
|-------------------------|------------------|---------------------------|
| -> CONFIRMED            | Admin, Expedicao | PATCH /orders/:id/status  |
| -> SEPARATING           | Admin, Expedicao | PATCH /orders/:id/separate|
| -> READY                | Admin, Expedicao | PATCH /orders/:id/pack    |
| -> IN_TRANSIT           | Motorista        | PATCH /orders/:id/load    |
| -> DELIVERED            | Motorista        | PATCH /orders/:id/deliver |
| -> CANCELLED            | Admin, Expedicao | PATCH /orders/:id/status  |

## API Endpoints

### Auth (`/auth`)
| Method | Path        | Auth | Roles  |
|--------|-------------|------|--------|
| POST   | `/login`    | No   | Public |
| POST   | `/register` | Yes  | ADMIN  |
| GET    | `/users`    | Yes  | ADMIN  |

### Users (`/users`)
| Method | Path        | Auth | Roles           |
|--------|-------------|------|-----------------|
| GET    | `/`         | Yes  | ADMIN           |
| POST   | `/`         | Yes  | ADMIN           |
| PATCH  | `/:id`      | Yes  | ADMIN           |
| POST   | `/clients`  | Yes  | ADMIN, VENDEDOR |

### Orders (`/orders`)
| Method | Path             | Auth | Roles                              |
|--------|------------------|------|------------------------------------|
| GET    | `/`              | Yes  | ADMIN, EXPEDICAO, MOTORISTA, VENDEDOR |
| POST   | `/`              | Yes  | ADMIN, VENDEDOR                    |
| GET    | `/:id`           | Yes  | ADMIN, EXPEDICAO, MOTORISTA, VENDEDOR |
| GET    | `/clients`       | Yes  | ADMIN, VENDEDOR                    |
| GET    | `/:id/invoice`   | Yes  | ADMIN, VENDEDOR                    |
| PATCH  | `/:id/status`    | Yes  | ADMIN, EXPEDICAO                   |
| PATCH  | `/:id/separate`  | Yes  | ADMIN, EXPEDICAO                   |
| PATCH  | `/:id/pack`      | Yes  | ADMIN, EXPEDICAO                   |
| PATCH  | `/:id/load`      | Yes  | MOTORISTA                          |
| PATCH  | `/:id/deliver`   | Yes  | ADMIN, MOTORISTA                   |

### Inventory (`/inventory`)
| Method | Path                  | Auth | Roles                    |
|--------|-----------------------|------|--------------------------|
| GET    | `/containers`         | Yes  | ADMIN, EXPEDICAO, VENDEDOR |
| GET    | `/containers/:id`     | Yes  | ADMIN, EXPEDICAO, VENDEDOR |
| PATCH  | `/containers/:id`     | Yes  | ADMIN                    |
| GET    | `/products`           | Yes  | ADMIN, EXPEDICAO, VENDEDOR |
| GET    | `/products/search`    | Yes  | ADMIN, EXPEDICAO, VENDEDOR |
| GET    | `/products/:id/stock` | Yes  | ADMIN, VENDEDOR, EXPEDICAO |
| POST   | `/products`           | Yes  | ADMIN                    |
| PATCH  | `/products/:id`       | Yes  | ADMIN                    |
| DELETE | `/products/:id`       | Yes  | ADMIN                    |

### Routes (`/routes`)
| Method | Path     | Auth | Roles           |
|--------|----------|------|-----------------|
| GET    | `/daily` | Yes  | ADMIN, MOTORISTA |

### System
| Method | Path      | Auth | Purpose          |
|--------|-----------|------|------------------|
| GET    | `/health` | No   | DB connectivity  |

## Routes (React Router)

```
/                          -> Login
/login                     -> Login
/unauthorized              -> Unauthorized

/admin                     -> AdminDashboard (layout) [ADMIN]
  /admin/dashboard         -> AdminHome (KPIs)
  /admin/inventory         -> Inventory (default redirect)
  /admin/orders/new        -> OrderEntry
  /admin/logistics         -> Logistics
  /admin/routes            -> DriverRoutes
  /admin/users             -> AdminUsers (CRUD)

/vendedor                  -> VendedorLayout [VENDEDOR]
  /vendedor/orders         -> VendedorOrders (default redirect)
  /vendedor/orders/new     -> OrderEntry

/expedicao                 -> ExpedicaoLayout [EXPEDICAO]
  /expedicao/dashboard     -> ExpedicaoDashboard (default redirect)
  /expedicao/orders        -> ExpedicaoOrders
  /expedicao/orders/:id    -> ExpedicaoPickingList
  /expedicao/containers    -> Inventory (reutilizado)
  /expedicao/logistics     -> Logistics (reutilizado)

/motorista                 -> MotoristaLayout [MOTORISTA]
  /motorista/routes        -> DriverRoutes (default redirect)
  /motorista/delivery/:id  -> DriverDelivery
```

> **Nota**: `/admin/products` NAO esta definido no router. AdminProducts.jsx existe mas nao e acessivel.

## Database Models (Prisma)

```
User         -> id, name, email, password, role (ADMIN|VENDEDOR|EXPEDICAO|MOTORISTA)
               address, lat?, lon?
Product      -> id, name, type (texto livre), active, priceType (PER_LB|PER_BOX|PER_UNIT),
               pricePerLb?, pricePerBox?, pricePerUnit?
Container    -> id, label, zone (enum ContainerZone), capacity, quantity, unit,
               productId?, updatedById?
Order        -> id, clientName (string), clientId? (legacy), status, totalBoxes, weightLb,
               address, lat/lon, deliveryWindowStart/End,
               deliveredAt/By, separatedAt/By, packedAt/By, loadedAt,
               updatedById?, lastStatusAt?
OrderItem    -> id, orderId, containerId, productId, quantity, weightLb,
               priceType (PER_LB|PER_BOX), pricePerLb?, pricePerBox?, boxWeights[]
BoxWeight    -> id, orderItemId, boxNumber, weightLb, updatedById?
```

### ContainerZone (enum)
`CAMARA_FRIA` | `CONTAINER_31` | `CONTAINER_32` | `CONTAINER_33` | `CONTAINER_36` | `BEBIDAS` | `SECOS`

## Seed Data

### Accounts

| Email               | Password       | Role      |
|---------------------|----------------|-----------|
| admin@saab.com      | 123456         | ADMIN     |
| vendedor@saab.com   | vendedor123    | VENDEDOR  |
| expedicao@saab.com  | expedicao123   | EXPEDICAO |
| motorista@saab.com  | motorist123    | MOTORISTA |

### Product Categories

`Bovino` | `Suino` | `Aves` | `Miudos` | `Laticinios` | `Congelados` | `Secos` | `Bebidas` | `Outros`

### Location (Orlando, FL)

- **Depot:** 28.4626, -81.3305 (6843 Conway Rd Ste 120, Orlando, FL 32812)

## Coding Standards

- **React**: Functional components, Hooks only. No class components.
- **CSS**: Tailwind CSS utility classes with CSS custom properties for theming (light/dark via `data-theme`). Fonts: Inter (sans), Montserrat (display).
- **Node**: Express 5, REST, Controllers/Services separation. Controllers = HTTP layer, Services = business logic + Prisma.
- **Currency**: USD ($). `toLocaleString('en-US', { currency: 'USD' })`.
- **Security**: JWT authentication (header-only, no query param tokens), bcrypt for passwords, environment variables for secrets.
- **Validation**: Zod schemas in `src/lib/schemas.js` for backend input validation. Frontend (UX) + Backend (Security). Never trust client input.
- **Audit**: All status-changing operations set `updatedById` (who) and `lastStatusAt` (when). Container mutations track `updatedById`.
- **Offline conflict detection**: Status endpoints accept optional `lastStatusAt` from client; server rejects (409) if stale.
- **Stock consistency**: `cancelOrder` reverts container quantities inside a transaction.
- **Patterns**: Clean Code, DRY, SOLID. Reusable components in `src/components/`.
- **Boolean fields**: Use `!== false` checks (not truthy) when a DB field has `@default(true)`, to handle `undefined` gracefully.

## Style Guide

### Theme
Suporta light/dark mode via `ThemeContext` + CSS custom properties. Toggle via `ThemeToggle.jsx`.

### Palette (CSS custom properties in index.css)

| Token         | Dark          | Light         | Usage                          |
|---------------|---------------|---------------|--------------------------------|
| --bg-page     | `#1a1a1a`     | `#f5f5f5`     | Page backgrounds               |
| --bg-surface  | `#1e1e1e`     | `#ffffff`     | Cards, panels, sidebars        |
| --bg-input    | `#2a2a2a`     | `#f9fafb`     | Inputs, selects                |
| --bg-hover    | `#252525`     | `#f3f4f6`     | Table row hover                |
| --border-base | `#333333`     | `#e5e7eb`     | Card borders                   |
| --border-input| `#3a3a3a`     | `#d1d5db`     | Input borders                  |
| --text-primary| `#f0f0f0`     | `#111827`     | Titles, body                   |
| --text-secondary| `#888888`   | `#6b7280`     | Labels, meta                   |
| --red-base    | `#8b0000`     | `#8b0000`     | Primary buttons, focus, badges |
| --red-hover   | `#720000`     | `#720000`     | Button hover                   |
| --status-ok   | `#15803d`     | `#15803d`     | Success, ready, delivered      |
| --status-warn | `#b45309`     | `#b45309`     | Warning, pending               |
| --status-error| `#f87171`     | `#ef4444`     | Error, cancelled               |

### Components
- Cards: `rounded-md`, `border border-base`
- Buttons primary: `bg-red-base`, white text, bold, uppercase
- Buttons secondary: `bg-transparent`, `border border-input`
- Badges: `rounded-full` (pill), colored per status
- Logo: Use `logo-saab.png` (transparent background), NOT the SVG
- Brand name text: **SAAB Foods** (not just "SAAB"). Use `font-medium`, color `#eb3138`. This color is ONLY for the brand name text.

### Responsiveness
Mobile-first. Tailwind breakpoints: `sm` (640px) -> `md` (768px) -> `lg` (1024px).

### Invoice PDF (InvoiceService.js)

**Fonts** (only two, no built-in Helvetica):
- `Helvetica World Italic` (`helvetica-world-italic.ttf`) -> alias `HelvBold` -- titles, labels, headers, amounts
- `IBM Plex Sans Italic` (`IBMPlexSans-Italic-VariableFont_wdth,wght.ttf`) -> alias `IBMItalic` -- addresses, descriptions, footer

**Logo**: `Logo-do-invoice.png` (includes "SAAB FOODS" text -- do NOT render text separately)

**Assets**: All in `backend/src/assets/`. Warns on missing assets at startup (non-fatal). Invoice endpoint fails individually if assets missing.

**Layout rules**:
- One row per item; box weights consolidated into multi-line DESCRIPTION
- Dynamic row height via `doc.heightOfString()`
- Table values (RATE, AMOUNT) use plain numbers; only BALANCE DUE uses `$`
- Multi-page support with header + table header on each page
- DUE DATE = `createdAt + 7 days`; TERMS = `Net 7`
- SALES REP shows `order.client?.email`

## Known Issues

- `/admin/products` route NOT defined in App.jsx -- AdminProducts.jsx page exists but is unreachable
- `fetchOrders()` and `fetchMyOrders()` in orderService.js are duplicates (same endpoint)
- `STATUS_CONFIG` objects duplicated across multiple page files (should be in constants)
- `react-signature-canvas` is installed but not imported anywhere (SignatureModal.jsx does not exist)

## Dead Code (do NOT import)

### Frontend
`NewOrder.jsx`, `ContainerCard.jsx`, `ContainerMap.jsx`, `InventoryList.jsx`, `OrderForm.jsx`, `ProductSelector.jsx`, `ClientPanel.jsx`, `ProductPanel.jsx`, `App.css`

### Backend
`fix.js` (one-off migration script), `vercel.js` (outdated serverless wrapper), `prisma/parser.js`, `prisma/parser.py`, `assets/Logo-saab-S.png` (unused)
