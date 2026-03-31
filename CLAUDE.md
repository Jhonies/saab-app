# CLAUDE.md — SAAB Gestão Logística

## Project Overview

Sistema de gestão para distribuidora de carnes, bebidas e acessórios para churrasco, baseada em Orlando, FL (EUA).
Moeda: **USD ($)**. Localização: **Orlando, Florida**.
Fluxo operacional: **Cliente faz pedido → Expedição confirma e separa → Motorista carrega e entrega → Admin monitoriza tudo.**

## Tech Stack

| Camada    | Stack                                       |
|-----------|---------------------------------------------|
| Frontend  | React 18, Vite, CSS Modules, react-router-dom, axios, react-signature-canvas |
| Backend   | Node.js, Express 5, Prisma ORM, PostgreSQL, JWT, pdfkit, bcrypt |
| Infra     | Docker Compose (PostgreSQL + backend), frontend local via Vite  |

## Commands

```bash
# Infra — PostgreSQL + Backend (Docker)
docker compose up --build -d          # build + start (auto migrate + seed)
docker compose logs -f backend        # logs
docker compose down                   # stop (dados preservados)
docker compose down -v                # stop + apagar DB

# Migrations & Seed (dentro do container ou local)
cd backend && npx prisma migrate dev --name <nome>
cd backend && npx prisma db seed

# Dev — Frontend (local)
cd frontend && npm install && npm run dev

# Dev — Backend (local, alternativa ao Docker)
cd backend && npm install && npm run dev
```

## Architecture

```
project/
├── backend/
│   ├── server.js                      # Express entry point, monta todas as rotas
│   ├── Dockerfile                     # Node 20-alpine, auto migrate deploy + seed + start
│   ├── prisma/
│   │   ├── schema.prisma              # User, Product, Container, Order, OrderItem
│   │   └── seed.js                    # 6 users + ~191 produtos reais + ~240 contêineres
│   └── src/
│       ├── middlewares/authMiddleware.js   # authMiddleware + authorizeRoles
│       ├── controllers/               # HTTP layer — validação de input, status codes
│       │   ├── AuthController.js
│       │   ├── InventoryController.js
│       │   ├── OrderController.js
│       │   ├── RouteController.js
│       │   └── UserController.js
│       ├── services/                  # Business logic — Prisma queries, cálculos
│       │   ├── InventoryService.js
│       │   ├── OrderService.js
│       │   ├── InvoiceService.js      # PDF generation (pdfkit), currency USD
│       │   ├── RouteService.js        # Haversine + nearest-neighbor, depot Orlando FL
│       │   └── UserService.js
│       └── routes/
│           ├── authRoutes.js          # POST /auth/login
│           ├── inventoryRoutes.js     # GET/PATCH /inventory/containers, GET/POST/PATCH/DELETE /inventory/products
│           ├── orderRoutes.js         # CRUD + /confirm /separate /pack /load /deliver /invoice
│           ├── routeRoutes.js         # GET /routes/daily
│           └── userRoutes.js          # GET/POST/PATCH /users (ADMIN only)
└── frontend/src/
    ├── context/AuthContext.jsx         # AuthProvider, useAuth — login, logout, token, user
    ├── services/
    │   ├── authService.js             # Axios instance + JWT interceptor
    │   ├── inventoryService.js        # fetchContainers, fetchProducts, fetchAllProducts, createProduct, updateProduct, deleteProduct
    │   ├── orderService.js            # fetchOrders, fetchOrderById, createOrder, confirmOrder, separateOrder, packOrder, loadOrder, openInvoice
    │   ├── routeService.js            # fetchDailyRoute
    │   └── userService.js             # fetchUsers, createUser, updateUser
    ├── constants/
    │   ├── zones.js                   # ZONE_CONFIG, ZONE_LABELS, SUBZONE_LABELS
    │   └── categories.js             # CATEGORIES (Bovino, Suíno, Aves, Miúdos, Laticínios, Congelados, Secos, Bebidas, Outros)
    ├── components/
    │   ├── ProtectedRoute.jsx         # Route guard por role JWT
    │   ├── SignatureModal.jsx         # Captura assinatura digital + PATCH deliver
    │   └── Inventory/
    │       ├── InventoryGrid.jsx      # Grid de contêineres por zona com busca e progresso
    │       ├── ContainerEditModal.jsx # Modal edição de contêiner
    │       └── ProductPanel.jsx       # Painel CRUD de produtos (preços em $)
    └── pages/
        ├── Login.jsx                  # Autenticação, redireciona por role
        ├── Unauthorized.jsx
        ├── AdminDashboard.jsx         # Layout shell admin (sidebar + topbar + Outlet) + AdminHome (KPIs)
        ├── AdminUsers.jsx             # CRUD utilizadores (modal)
        ├── AdminProducts.jsx          # CRUD produtos (modal, toggle activo/inactivo, preços em $)
        ├── Inventory.jsx              # Wrapper → InventoryGrid
        ├── OrderEntry.jsx             # Formulário de pedido com validação de stock
        ├── Logistics.jsx              # Tabela de pedidos, fatura PDF, mapa (endereços Orlando FL)
        ├── DriverRoutes.jsx           # Rota optimizada, paradas, link Google Maps
        ├── DriverDelivery.jsx         # Detalhe entrega: carga → assinatura → entregue
        ├── ExpedicaoLayout.jsx        # Layout shell expedição (sidebar + topbar + Outlet)
        ├── ExpedicaoDashboard.jsx     # Contadores por status
        ├── ExpedicaoOrders.jsx        # Fila de trabalho com filtros
        ├── ExpedicaoPickingList.jsx   # Picking list + transições de status
        ├── MotoristaLayout.jsx        # Layout shell motorista (topbar + Outlet)
        ├── ClienteLayout.jsx          # Layout shell cliente (topbar + Outlet)
        └── ClientOrders.jsx           # Pedidos do cliente
```

## Roles & Permissions

| Role       | Redirect        | Access |
|------------|-----------------|--------|
| `ADMIN`    | `/admin`        | Dashboard KPIs, inventário, produtos, pedidos, logística, rotas, utilizadores |
| `EXPEDICAO`| `/expedicao`    | Dashboard contadores, fila de pedidos, picking list, contêineres |
| `MOTORISTA`| `/motorista`    | Rota do dia, detalhe de entrega, assinatura digital |
| `CLIENTE`  | `/cliente`      | Pedidos próprios, novo pedido, fatura PDF |

## Order Status Pipeline

```
PENDING → CONFIRMED → SEPARATING → READY → IN_TRANSIT → DELIVERED
                   ↘ CANCELLED (antes de IN_TRANSIT)
```

| Transition              | Who              | Endpoint                  |
|-------------------------|------------------|---------------------------|
| → CONFIRMED             | Admin, Expedição | PATCH /orders/:id/status  |
| → SEPARATING            | Admin, Expedição | PATCH /orders/:id/separate|
| → READY                 | Admin, Expedição | PATCH /orders/:id/pack    |
| → IN_TRANSIT            | Motorista        | PATCH /orders/:id/load    |
| → DELIVERED (+ assinatura) | Motorista     | PATCH /orders/:id/deliver |
| → CANCELLED             | Admin, Expedição | PATCH /orders/:id/status  |

## Routes (React Router)

```
/                          → Login
/login                     → Login
/unauthorized              → Unauthorized

/admin                     → AdminDashboard (layout)
  /admin/dashboard         → AdminHome (KPIs reais)
  /admin/inventory         → Inventory (InventoryGrid)
  /admin/products          → AdminProducts (CRUD)
  /admin/orders/new        → OrderEntry
  /admin/logistics         → Logistics
  /admin/routes            → DriverRoutes
  /admin/users             → AdminUsers (CRUD)

/expedicao                 → ExpedicaoLayout
  /expedicao/dashboard     → ExpedicaoDashboard
  /expedicao/orders        → ExpedicaoOrders
  /expedicao/orders/:id    → ExpedicaoPickingList
  /expedicao/containers    → Inventory (InventoryGrid reutilizado)

/motorista                 → MotoristaLayout
  /motorista/routes        → DriverRoutes
  /motorista/delivery/:id  → DriverDelivery

/cliente                   → ClienteLayout
  /cliente/orders          → ClientOrders
  /cliente/orders/new      → OrderEntry
```

## Database Models (Prisma)

```
User         → id, email, password, role (ADMIN|EXPEDICAO|MOTORISTA|CLIENTE)
Product      → id, name, type (Bovino|Suíno|Aves|Miúdos|Laticínios|Congelados|Secos|Bebidas|Outros), pricePerBox (USD), active
Container    → id, label, zone (CAMARA_FRIA|CAMARA_FRIA_FORA|CONTAINERS|SECOS|OPEN_BOX),
               subZone? (NASSIF|SAAB|BEBIDAS), capacity, quantity, productId?
Order        → id, clientId, status, totalBoxes, weightKg, address, lat/lon,
               deliveryWindow, signature, deliveredAt/By, separatedAt/By, packedAt/By, loadedAt
OrderItem    → id, orderId, containerId, productId, quantity, weightKg
```

## Seed Data

### Accounts

| Email               | Password       | Role      |
|---------------------|----------------|-----------|
| admin@saab.com      | 123456         | ADMIN     |
| expedicao@saab.com  | expedicao123   | EXPEDICAO |
| motorista@saab.com  | motorista123   | MOTORISTA |
| frigorifico.norte@saab.com | 123456  | CLIENTE   |
| distribuidora.sul@saab.com | 123456  | CLIENTE   |
| supermercado.abc@saab.com  | 123456  | CLIENTE   |

### Inventory (~191 produtos, ~240 contêineres)

| Zona | Prefixo | Conteúdo |
|------|---------|----------|
| Câmara Fria | CF-xx | Carnes bovinas, suínas, laticínios |
| Câmara Fria / Fora | CFF-xx | Carnes, aves, miúdos |
| Container 36 | CT36-xx | Carnes, congelados (tostones, yuca, batata) |
| Container 33 | CT33-xx | Miúdos, aves, suínos, congelados |
| Container 32 | CT32-xx | Carnes bovinas, aves |
| Container 31 | CT31-xx | Aves, carnes, congelados |
| Secos / Nassif | SN-xx | Polvilho, palmito |
| Secos / Saab | SS-xx | Polvilho, palmito |
| Bebidas | SB-xx | Cerveja (Império), cachaça (51), vinhos, energéticos (Baly) |
| Open Box | OB-xx | Bebidas avulsas |

### Product Categories

`Bovino` · `Suíno` · `Aves` · `Miúdos` · `Laticínios` · `Congelados` · `Secos` · `Bebidas` · `Outros`

### Location (Orlando, FL)

- **Depot:** 28.5383, -81.3792 (Orlando, FL)
- **Client addresses:** Dr Phillips Blvd, Conroy Rd (Orlando), Irlo Bronson Hwy (Kissimmee)

## Coding Standards

- **React**: Functional components, Hooks only. No class components.
- **CSS**: CSS Modules exclusively (`Component.module.css`). NO Tailwind, NO inline styles, NO styled-components.
- **Node**: Express, REST, Controllers/Services separation. Controllers = HTTP, Services = business logic.
- **Currency**: USD ($). Preços em dólar americano. `toLocaleString('en-US', { currency: 'USD' })`.
- **Security**: JWT authentication, bcrypt for passwords, environment variables for secrets.
- **Validation**: Frontend (UX) + Backend (Security). Never trust client input.
- **Patterns**: Clean Code, DRY, SOLID. Reusable components in `src/components/`.
- **Boolean fields**: Use `!== false` checks (not truthy) when a DB field has `@default(true)`, to handle `undefined` gracefully.

## Style Guide

### Theme
Tema industrial escuro, sóbrio e funcional. Alto contraste, vermelho como cor de acento.

### Palette

| Token         | Hex       | Usage                                    |
|---------------|-----------|------------------------------------------|
| bg-page       | `#1a1a1a` | Page backgrounds                         |
| bg-surface    | `#1e1e1e` | Cards, panels, sidebars                  |
| bg-input      | `#2a2a2a` | Inputs, selects                          |
| bg-hover      | `#252525` | Table row hover                          |
| border-base   | `#333333` | Card borders                             |
| border-input  | `#3a3a3a` | Input borders                            |
| text-primary  | `#f0f0f0` | Titles, body                             |
| text-secondary| `#888888` | Labels, meta                             |
| text-muted    | `#505050` | Placeholders, disabled                   |
| red-base      | `#8b0000` | Primary buttons, focus borders, badges   |
| red-hover     | `#720000` | Button hover                             |
| red-active    | `#5a0000` | Button pressed                           |
| status-ok     | `#15803d` | Success, ready, delivered                |
| status-warn   | `#b45309` | Warning, pending                         |
| status-error  | `#f87171` | Error, cancelled                         |
| blue-accent   | `#1a6bb5` | Separating status, info highlights       |

### Components
- Cards: `border-radius: 6px`, `border: 1px solid #333`
- Inputs: `border-radius: 4px`, focus `box-shadow: 0 0 0 3px rgba(139,0,0,0.22)`
- Badges: `border-radius: 999px` (pill), `border: 1px solid`, colored per status
- Buttons primary: `bg #8b0000`, white text, bold, uppercase
- Buttons secondary: `bg transparent`, `border: 1px solid #3a3a3a`
- Shadows: elevated `0 16px 48px rgba(0,0,0,0.55)`, subtle `0 4px 12px rgba(0,0,0,0.4)`
- Logo: Use `logo-saab.png` (transparent background), NOT the SVG

### Responsiveness
Mobile-first. Breakpoints: `480px` → `768px` → `1024px`.

### Legacy Files (do NOT import)
`Dashboard.jsx`, `NewOrder.jsx`, `ContainerCard.jsx`, `ContainerMap.jsx`, `InventoryList.jsx`, `OrderForm.jsx`, `ProductSelector.jsx`
