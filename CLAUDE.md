# CLAUDE.md — SAAB Gestão Logística

## Project Overview

Sistema de gestão para distribuidora de carnes, bebidas e acessórios para churrasco, baseada em Orlando, FL (EUA).
Moeda: **USD ($)**. Localização: **Orlando, Florida**.
Fluxo operacional: **Vendedor faz pedido (digita nome da loja) → Expedição confirma, separa e insere pesos → Motorista carrega e entrega → Admin monitoriza tudo.**

> **Nota**: O CLIENTE não faz mais parte do fluxo. O vendedor digita o nome da loja diretamente no pedido. O campo `clientName` substitui o `clientId` do User.

## Tech Stack

| Camada    | Stack                                       |
|-----------|---------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, react-router-dom, axios, react-signature-canvas |
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
│       │   ├── InvoiceService.js      # PDF generation (pdfkit), currency USD, custom fonts (Helvetica World + IBM Plex Sans), multi-page support
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
│   ├── inventoryService.js        # fetchContainers, fetchProducts, fetchAllProducts, createProduct, updateProduct, deleteProduct, fetchProductStock, searchProducts
│   ├── orderService.js            # fetchOrders, fetchOrderById, createOrder, confirmOrder, separateOrder, packOrder, loadOrder, deliverOrder, openInvoice, fetchClients
│   ├── routeService.js            # fetchDailyRoute
│   └── userService.js             # fetchUsers, createUser, updateUser, createClient
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
        ├── VendedorLayout.jsx          # Layout shell vendedor (topbar + Outlet)
        ├── VendedorOrders.jsx          # Lista de pedidos criados
        └── MotoristaLayout.jsx        # Layout shell motorista (topbar + Outlet)
```

## Roles & Permissions

| Role       | Redirect        | Access |
|------------|-----------------|--------|
| `ADMIN`    | `/admin`        | Dashboard KPIs, inventário, produtos, pedidos, logística, rotas, utilizadores |
| `VENDEDOR` | `/vendedor`    | Criar pedidos para clientes, visualizar pedidos |
| `EXPEDICAO`| `/expedicao`    | Dashboard contadores, fila de pedidos, picking list, contêineres, entrada de pesos |
| `MOTORISTA`| `/motorista`    | Rota do dia, detalhe de entrega, assinatura digital |

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
  /admin/products          → AdminProducts (CRUD produtos, toggle activo/inactivo)
  /admin/orders/new        → OrderEntry
  /admin/logistics         → Logistics
  /admin/routes            → DriverRoutes
  /admin/users             → AdminUsers (CRUD)

/vendedor                  → VendedorLayout
  /vendedor/orders         → VendedorOrders (criar pedidos)
  /vendedor/orders/new     → OrderEntry

/expedicao                 → ExpedicaoLayout
  /expedicao/dashboard     → ExpedicaoDashboard
  /expedicao/orders        → ExpedicaoOrders
  /expedicao/orders/:id    → ExpedicaoPickingList
  /expedicao/containers    → Inventory (InventoryGrid reutilizado)

/motorista                 → MotoristaLayout
  /motorista/routes        → DriverRoutes
  /motorista/delivery/:id  → DriverDelivery

/cliente                   → ClienteLayout (opcional - histórico de pedidos)
  /cliente/orders          → ClientOrders (histórico + fatura PDF)
```

## Database Models (Prisma)

```
User         → id, name, email, password, role (ADMIN|VENDEDOR|EXPEDICAO|MOTORISTA|CLIENTE)
Product      → id, name, type (texto livre), active, priceType (PER_LB|PER_BOX|PER_UNIT),
               pricePerLb?, pricePerBox?, pricePerUnit?
Container    → id, label, zone (CAMARA_FRIA|CONTAINER_31|CONTAINER_32|CONTAINER_33|CONTAINER_36|BEBIDAS|SECOS),
               capacity, quantity, productId?
Order        → id, clientName (string), clientId? (legacy), status, totalBoxes, weightLb, address, lat/lon,
               deliveryWindowStart/End, signature, deliveredAt/By, separatedAt/By/At, packedAt/By/At, loadedAt
OrderItem    → id, orderId, containerId, productId, quantity, weightLb, priceType (PER_LB|PER_BOX),
               pricePerLb?, pricePerBox?, boxWeights (BoxWeight[])
BoxWeight    → id, orderItemId, boxNumber, weightLb (peso individual por caixa)
```

## Seed Data

### Accounts

| Email               | Password       | Role      |
|---------------------|----------------|-----------|
| admin@saab.com      | 123456         | ADMIN     |
| vendedor@saab.com   | vendedor123    | VENDEDOR  |
| expedicao@saab.com  | expedicao123   | EXPEDICAO |
| motorista@saab.com   | motorist123    | MOTORISTA |

### Inventory (~191 produtos, ~240 contêineres)

| Container 36 | Carnes, congelados (tostones, yuca, batata) |
| Container 33 | Miúdos, aves, suínos, congelados |
| Container 32 | Carnes bovinas, aves |
| Container 31 | Aves, carnes, congelados |
| Secos / Nassif | Polvilho, palmito |
| Secos / Saab | Polvilho, palmito |
| Bebidas | Cerveja (Império), cachaça (51), vinhos, energéticos (Baly) |
| Open Box | Bebidas avulsas |

### Product Categories

`Bovino` · `Suíno` · `Aves` · `Miúdos` · `Laticínios` · `Congelados` · `Secos` · `Bebidas` · `Outros`

### Location (Orlando, FL)

- **Depot:** 28.4626, -81.3305 (6843 Conway Rd Ste 120, Orlando, FL 32812)
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
| accent        | `#4a4a4a` | Secondary highlights (dark gray)         |

### Components
- Cards: `border-radius: 6px`, `border: 1px solid #333`
- Inputs: `border-radius: 4px`, focus `box-shadow: 0 0 0 3px rgba(139,0,0,0.22)`
- Badges: `border-radius: 999px` (pill), `border: 1px solid`, colored per status
- Buttons primary: `bg #8b0000`, white text, bold, uppercase
- Buttons secondary: `bg transparent`, `border: 1px solid #3a3a3a`
- Shadows: elevated `0 16px 48px rgba(0,0,0,0.55)`, subtle `0 4px 12px rgba(0,0,0,0.4)`
- Logo: Use `logo-saab.png` (transparent background), NOT the SVG
- Brand name text: **SAAB Foods** (not just "SAAB"). Use `font-medium` (not bold/black), color `#eb3138` (logo red). This color is ONLY for the brand name text, not for buttons or other UI elements.

### Responsiveness
Mobile-first. Breakpoints: `480px` → `768px` → `1024px`.

### Invoice PDF (InvoiceService.js)

**Fonts** (only two, no built-in Helvetica):
- `Helvetica World Italic` (`helvetica-world-italic.ttf`) → alias `HelvBold` — all titles, labels, section headers, product names, amounts, BALANCE DUE
- `IBM Plex Sans Italic` (`IBMPlexSans-Italic-VariableFont_wdth,wght.ttf`) → alias `IBMItalic` — addresses, descriptions, metadata values, footer text, signatures

**Logo**: `Logo-do-invoice.png` (includes "SAAB FOODS" text — do NOT render text separately)

**Layout rules**:
- One row per item; box weights consolidated into multi-line DESCRIPTION (`{type}\n{NN} CASES\n{w1} + {w2} + ...`)
- Dynamic row height via `doc.heightOfString()` based on description content
- Table values (RATE, AMOUNT) use plain numbers (`fmtNum`); only BALANCE DUE uses `$` (`fmt`)
- Multi-page: when rows exceed `PAGE_BOTTOM`, draws table border, adds new page with header + table header, continues
- DUE DATE = `createdAt + 7 days`; TERMS = `Net 7`
- SALES REP shows `order.client?.email`
- Reference model: `frontend/src/assets/Model-Example-Invoice.png`

### Legacy Files (do NOT import)
`Dashboard.jsx`, `NewOrder.jsx`, `ContainerCard.jsx`, `ContainerMap.jsx`, `InventoryList.jsx`, `OrderForm.jsx`, `ProductSelector.jsx`
