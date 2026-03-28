# CLAUDE.md - Project Guide

## Commands
- Install: npm install (run in root, frontend, and backend)
- Dev Frontend: cd frontend && npm run dev
- Dev Backend: cd backend && npm run dev
- Test: npm test
- Lint: npm run lint

## Coding Standards
- React: Functional components, Hooks, CSS Modules for styling (NO Tailwind).
- Node: Express, REST patterns, Controllers/Services/Models separation.
- Security: JWT for authentication, environment variables for secrets.
- Patterns: Clean Code, DRY, SOLID principles.
- Components: Reusable components in src/components.

## Architecture Guidelines
- Never mix frontend and backend code.
- Validation must be performed on both frontend (UX) and backend (Security).
- Backend services handle business logic; controllers handle HTTP.

## UI/UX Guidelines
- UI Pattern: Mobile-first (mesmo na web) para uso em tablets no galpão.
- Inventory UI: Usar Grid System para representar o Mapa de Contêineres.
- Forms: Validação rigorosa de pesos (kg) e quantidades (caixas).

## Style Guide — SAAB Gestão Logística

### Identidade Visual
Tema industrial escuro, sóbrio e funcional. Inspirado em ambientes de galpão frigorífico:
alto contraste, tipografia clara, uso de vermelho como cor de acento (referência à carne).

### Paleta de Cores

#### Backgrounds
| Token         | Hex       | Uso                                      |
|---------------|-----------|------------------------------------------|
| bg-page       | `#1a1a1a` | Fundo de todas as páginas                |
| bg-surface    | `#1e1e1e` | Cards, painéis, sidebars                 |
| bg-input      | `#2a2a2a` | Inputs, selects, textareas               |
| bg-hover      | `#252525` | Hover em linhas de tabela / list items   |

#### Borders
| Token         | Hex       | Uso                                      |
|---------------|-----------|------------------------------------------|
| border-base   | `#333333` | Bordas de cards e containers             |
| border-input  | `#3a3a3a` | Bordas de inputs em repouso              |

#### Texto
| Token         | Hex       | Uso                                      |
|---------------|-----------|------------------------------------------|
| text-primary  | `#f0f0f0` | Títulos e conteúdo principal             |
| text-secondary| `#888888` | Labels, subtítulos, meta-informação      |
| text-muted    | `#505050` | Placeholders, rodapés, desabilitados     |

#### Acento — Vermelho (ação e destaque)
| Token         | Hex       | Uso                                      |
|---------------|-----------|------------------------------------------|
| red-dark      | `#3d0000` | Header de card, fundo de secções críticas|
| red-base      | `#8b0000` | Botões primários, bordas de foco, badges |
| red-hover     | `#720000` | Hover em botões primários                |
| red-active    | `#5a0000` | Active/pressed em botões                 |
| red-accent    | `#f4a0a0` | Eyebrow text sobre fundo vermelho escuro |

#### Estado — Feedback
| Token         | Hex       | Uso                                      |
|---------------|-----------|------------------------------------------|
| status-ok     | `#15803d` | Sucesso, disponível, entregue            |
| status-warn   | `#b45309` | Atenção, parcial, em trânsito            |
| status-error  | `#f87171` | Erro, cheio, rejeitado                   |
| status-error-bg| `#140a0a`| Fundo de banners de erro                 |

### Tipografia
- Font: `system-ui, 'Segoe UI', Roboto, sans-serif`
- Labels de campo: `0.6875rem`, uppercase, `letter-spacing: 0.12em`, `color: #888`
- Eyebrow/categoria: `0.625rem`, uppercase, `letter-spacing: 0.25em`
- Body: `0.875rem`, `color: #f0f0f0`
- Subtítulo/meta: `0.8125rem`, `color: #666`

### Bordas e Arredondamento
- Cards e containers: `border-radius: 6px`
- Inputs e botões: `border-radius: 4px`
- Badges de status: `border-radius: 999px` (pill)
- Evitar arredondamentos superiores a `8px` — estilo sóbrio industrial.

### Sombras
- Card elevado: `box-shadow: 0 16px 48px rgba(0,0,0,0.55)`
- Card sutil: `box-shadow: 0 4px 12px rgba(0,0,0,0.4)`

### Botões
- **Primário**: `bg #8b0000`, texto branco, bold, uppercase, `border-radius: 4px`
- **Secundário**: `bg transparent`, `border: 1px solid #3a3a3a`, texto `#888`
- **Destrutivo**: `bg #5a0000`, reservado para ações irreversíveis
- Todos os botões: `transition: background-color 0.18s`, cursor `not-allowed` quando disabled

### Inputs
- Fundo `#2a2a2a`, border `#3a3a3a`, texto `#f0f0f0`
- Foco: `border-color: #8b0000`, `box-shadow: 0 0 0 3px rgba(139,0,0,0.22)`
- Placeholder: `#505050`

### Estilização
- Usar exclusivamente **CSS Modules** (`Component.module.css`).
- Sem Tailwind, sem CSS inline, sem styled-components.
- Cada componente/página tem o seu próprio `.module.css` na mesma pasta.

### Responsividade
- Mobile-first. Breakpoints:
  - `480px` — tablets pequenos / landscape mobile
  - `768px` — tablets
  - `1024px` — desktop

---

## Componentes e Páginas Existentes

> Lista completa para evitar importações erradas ou ficheiros duplicados.

### Backend — `backend/`

| Caminho | Descrição |
|---|---|
| `server.js` | Entry point Express, monta as 4 rotas |
| `prisma/schema.prisma` | Modelos: User, Product, Container, Order, OrderItem |
| `prisma/seed.js` | Seed: admin@saab.com + 3 clientes + 7 produtos + 12 contêineres |
| `src/middlewares/authMiddleware.js` | `authMiddleware` + `authorizeRoles` (aceita token via header ou query param `?token=`) |
| `src/controllers/AuthController.js` | `login` |
| `src/controllers/InventoryController.js` | `listContainers`, `getContainer`, `updateContainer`, `listProducts` |
| `src/controllers/OrderController.js` | `createOrder`, `listOrders`, `getOrder`, `listClients`, `getInvoice`, `deliverOrder` |
| `src/controllers/RouteController.js` | `getDailyRoute` |
| `src/services/InventoryService.js` | CRUD de contêineres e produtos (Prisma) |
| `src/services/OrderService.js` | `createOrder` (transação Prisma), `deliverOrder` |
| `src/services/InvoiceService.js` | Geração de PDF com pdfkit (cabeçalho SAAB, tabela de produtos, total) |
| `src/services/RouteService.js` | Haversine + nearest-neighbor + penalidade de janela de entrega |
| `src/services/UserService.js` | `findByEmail`, `validatePassword` |
| `src/routes/authRoutes.js` | `POST /auth/login` |
| `src/routes/inventoryRoutes.js` | `GET/PATCH /inventory/containers`, `GET /inventory/products` |
| `src/routes/orderRoutes.js` | `GET /orders/clients`, `GET /orders/:id/invoice`, `PATCH /orders/:id/deliver`, `GET/POST /orders`, `GET /orders/:id` |
| `src/routes/routeRoutes.js` | `GET /routes/daily` |

### Frontend — `frontend/src/`

#### Páginas (`pages/`)

| Ficheiro | Rota | Descrição |
|---|---|---|
| `Login.jsx` + `.module.css` | `/login` | Autenticação JWT, redireciona por role |
| `AdminDashboard.jsx` + `.module.css` | `/admin` | **Layout shell** — sidebar azul naval + topbar + `<Outlet />`. Exporta também `AdminHome` (painel de boas-vindas + stats) |
| `Inventory.jsx` + `.module.css` | `/admin/inventory` | Wrapper do Módulo A — monta `<InventoryGrid />` |
| `OrderEntry.jsx` + `.module.css` | `/admin/orders/new` | Módulo B — formulário de pedido com validação de stock |
| `Logistics.jsx` + `.module.css` | `/admin/logistics` | Módulo C — tabela de pedidos, fatura PDF, modal de mapa |
| `DriverRoutes.jsx` + `.module.css` | `/admin/routes` e `/motorista/routes` | Módulo D — rota optimizada com paradas numeradas e link Google Maps |
| `Unauthorized.jsx` | `/unauthorized` | Página de acesso negado |
| `Dashboard.jsx` | *(não usado)* | Ficheiro legado — não importar |
| `NewOrder.jsx` | *(não usado)* | Ficheiro legado — não importar |

#### Componentes (`components/`)

| Ficheiro | Descrição |
|---|---|
| `ProtectedRoute.jsx` | Guard de rota por role JWT |
| `SignatureModal.jsx` + `.module.css` | Modal react-signature-canvas — captura assinatura e envia PATCH `/orders/:id/deliver` |
| `Inventory/InventoryGrid.jsx` + `.module.css` | **Grid de 12 contêineres** — barra de busca, glow azul (#1a6bb5) no match, barra de progresso por slot. Já implementado e funcional. |
| `Inventory/ContainerCard.jsx` | Card individual de contêiner (legado/placeholder) |
| `Inventory/ContainerMap.jsx` | Mapa de contêineres (legado/placeholder) |
| `Inventory/InventoryList.jsx` | Lista de inventário (legado/placeholder) |
| `Orders/OrderForm.jsx` | Formulário de pedido (legado/placeholder) |
| `Orders/ProductSelector.jsx` | Selector de produto (legado/placeholder) |

#### Contexto, Serviços e Config

| Ficheiro | Descrição |
|---|---|
| `context/AuthContext.jsx` | `AuthProvider`, `useAuth` — login, logout, token, user |
| `services/authService.js` | Instância axios com interceptor JWT automático |
| `services/inventoryService.js` | `fetchContainers()`, `fetchProducts()` |
| `services/orderService.js` | `fetchOrders()`, `fetchClients()`, `createOrder()`, `openInvoice()` |
| `services/routeService.js` | `fetchDailyRoute()` |

### Rotas React (`App.jsx`)

```
/                    → Login
/login               → Login
/unauthorized        → Unauthorized
/admin               → AdminDashboard (layout)
  /admin/dashboard   → AdminHome
  /admin/inventory   → Inventory (InventoryGrid)
  /admin/orders/new  → OrderEntry
  /admin/logistics   → Logistics
  /admin/routes      → DriverRoutes
/cliente/catalog     → placeholder
/cliente/orders/new  → OrderEntry
/motorista/routes    → DriverRoutes
```