# CONTEXT.md — SAAB Gestão Logística
> Snapshot do estado actual do projecto. Actualizar sempre que um módulo for concluído.
> Última actualização: 2026-03-30

---

## Status do Projecto

| Módulo | Estado | Descrição |
|---|---|---|
| Auth / JWT | ✅ Completo | Login funcional, token 8h, role-based redirect por 4 roles |
| Banco de Dados | ✅ Completo | PostgreSQL via Docker + Prisma 5.22, migrations aplicadas |
| Seed de Dados | ✅ Completo | Admin + expedição + 3 clientes + 7 produtos + 12 contêineres |
| Módulo A — Inventário | ✅ Completo | Grid 12 slots, busca com glow azul, barra de progresso |
| Módulo B — Pedidos | ✅ Completo | Formulário + transação Prisma + validação de stock |
| Módulo C — Faturamento | ✅ Completo | PDF pdfkit + assinatura digital react-signature-canvas |
| Módulo D — Roteirização | ✅ Completo | Haversine + nearest-neighbor + janelas de entrega |
| Layout Admin | ✅ Completo | Sidebar (7 links), topbar, nav activo por URL, KPIs reais |
| Gestão de Utilizadores | ✅ Completo | CRUD via modal (ADMIN only) |
| Gestão de Produtos | ✅ Completo | CRUD via modal, toggle activo/inactivo, categorias livres |
| Interface Expedição | ✅ Completo | Layout + dashboard + fila de pedidos + picking list |
| Interface Motorista | ✅ Completo | Rota do dia + detalhe de entrega + assinatura |
| Interface Cliente | ✅ Completo | Pedidos próprios + novo pedido |
| Pipeline de Status | ✅ Completo | PENDING → CONFIRMED → SEPARATING → READY → IN_TRANSIT → DELIVERED |

---

## Roles do Sistema

| Role | Login de Teste | Redirect | Acesso |
|---|---|---|---|
| `ADMIN` | admin@saab.com / 123456 | `/admin` | Tudo: inventário, produtos, pedidos, logística, rotas, utilizadores |
| `EXPEDICAO` | expedicao@saab.com / expedicao123 | `/expedicao` | Dashboard contadores, fila de pedidos, picking list, contêineres |
| `MOTORISTA` | *(criar via admin)* | `/motorista` | Rota do dia, detalhe de entrega, assinatura digital |
| `CLIENTE` | frigorifico.norte@saab.com / 123456 | `/cliente` | Pedidos próprios, novo pedido, fatura PDF |

---

## Arquitectura

```
backend/   → Express 5, porta 3000 (Docker ou local)
frontend/  → React 18 + Vite, porta 5173 (local)
database/  → PostgreSQL 16 via Docker, porta 5432
```

### Backend — Fluxo de pedido HTTP
```
Request → authMiddleware (verifica JWT header ou ?token=)
        → authorizeRoles (valida role)
        → Controller (parse HTTP, validação de input)
        → Service (lógica de negócio / Prisma)
        → Response JSON
```

### Frontend — Fluxo de autenticação
```
Login → AuthContext.login()
      → POST /auth/login
      → JWT guardado em localStorage
      → axios interceptor injeta Bearer em todos os pedidos
      → redirect por role: /admin | /expedicao | /motorista | /cliente
```

---

## Rotas React (App.jsx)

```
/admin                     → AdminDashboard (layout shell)
  /admin/dashboard         → AdminHome (KPIs: pedidos hoje, kg entregues, prontos, separação, pendentes)
  /admin/inventory         → Inventory (InventoryGrid)
  /admin/products          → AdminProducts (CRUD com toggle activo/inactivo)
  /admin/orders/new        → OrderEntry
  /admin/logistics         → Logistics (tabela de pedidos, PDF, mapa)
  /admin/routes            → DriverRoutes
  /admin/users             → AdminUsers (CRUD com modal)

/expedicao                 → ExpedicaoLayout (sidebar industrial)
  /expedicao/dashboard     → ExpedicaoDashboard (4 cards: pendentes, confirmados, separação, prontos)
  /expedicao/orders        → ExpedicaoOrders (fila de trabalho, filtros por status)
  /expedicao/orders/:id    → ExpedicaoPickingList (picking list + transições de status + peso real)
  /expedicao/containers    → Inventory (InventoryGrid reutilizado)

/motorista                 → MotoristaLayout (topbar simples)
  /motorista/routes        → DriverRoutes (rota optimizada, paradas com link Google Maps)
  /motorista/delivery/:id  → DriverDelivery (detalhe: carga → assinatura → confirmação)

/cliente                   → ClienteLayout (topbar simples)
  /cliente/orders          → ClientOrders
  /cliente/orders/new      → OrderEntry
```

---

## Pipeline de Pedidos

```
PENDING → CONFIRMED → SEPARATING → READY → IN_TRANSIT → DELIVERED
                   ↘ CANCELLED (antes de IN_TRANSIT)
```

| Transição | Quem | Endpoint | Onde na UI |
|---|---|---|---|
| → CONFIRMED | Admin, Expedição | `PATCH /orders/:id/status` | ExpedicaoPickingList |
| → SEPARATING | Admin, Expedição | `PATCH /orders/:id/separate` | ExpedicaoPickingList |
| → READY | Admin, Expedição | `PATCH /orders/:id/pack` | ExpedicaoPickingList (+ peso real) |
| → IN_TRANSIT | Motorista | `PATCH /orders/:id/load` | DriverDelivery |
| → DELIVERED | Motorista | `PATCH /orders/:id/deliver` | DriverDelivery (+ assinatura) |
| → CANCELLED | Admin, Expedição | `PATCH /orders/:id/status` | ExpedicaoPickingList / Logistics |

---

## Base de Dados — Modelos Prisma

```
User          id, email (unique), password, role (ADMIN|EXPEDICAO|MOTORISTA|CLIENTE), createdAt, updatedAt
Product       id, name, type (categoria livre), pricePerBox, active (@default true), createdAt
Container     id, label (unique, C-01..C-12), capacity, quantity, productId?
Order         id, clientId, status, totalBoxes, weightKg, address, lat?, lon?,
              deliveryWindowStart/End, signature?, deliveredAt/By?,
              separatedAt/By?, packedAt/By?, loadedAt?, createdAt, updatedAt
OrderItem     id, orderId, containerId, productId, quantity, weightKg
```

---

## API — Endpoints

### Auth
| Método | Rota | Roles | Descrição |
|---|---|---|---|
| POST | `/auth/login` | público | Retorna JWT |

### Inventário
| Método | Rota | Roles | Descrição |
|---|---|---|---|
| GET | `/inventory/containers` | ADMIN, CLIENTE | Lista contêineres com produto |
| GET | `/inventory/containers/:id` | ADMIN, CLIENTE | Detalhe de contêiner |
| PATCH | `/inventory/containers/:id` | ADMIN | Actualiza quantidade/produto |
| GET | `/inventory/products` | ADMIN, CLIENTE | Lista produtos activos (`?all=true` para incluir inactivos, ADMIN only) |
| POST | `/inventory/products` | ADMIN | Cria produto |
| PATCH | `/inventory/products/:id` | ADMIN | Actualiza produto (incluindo active) |
| DELETE | `/inventory/products/:id` | ADMIN | Remove produto (falha se em uso) |

### Pedidos
| Método | Rota | Roles | Descrição |
|---|---|---|---|
| GET | `/orders` | ADMIN, EXPEDICAO, MOTORISTA, CLIENTE | Lista pedidos (CLIENTE vê só os seus) |
| POST | `/orders` | ADMIN, CLIENTE | Cria pedido (transação Prisma) |
| GET | `/orders/:id` | ADMIN, EXPEDICAO, MOTORISTA, CLIENTE | Detalhe |
| GET | `/orders/clients` | ADMIN | Lista utilizadores CLIENTE |
| GET | `/orders/:id/invoice` | ADMIN, CLIENTE | PDF da fatura (`?token=` para auth) |
| PATCH | `/orders/:id/status` | ADMIN, EXPEDICAO | Confirma ou cancela |
| PATCH | `/orders/:id/separate` | ADMIN, EXPEDICAO | CONFIRMED → SEPARATING |
| PATCH | `/orders/:id/pack` | ADMIN, EXPEDICAO | SEPARATING → READY |
| PATCH | `/orders/:id/load` | MOTORISTA | READY → IN_TRANSIT |
| PATCH | `/orders/:id/deliver` | ADMIN, MOTORISTA | IN_TRANSIT → DELIVERED (+ assinatura) |

### Utilizadores
| Método | Rota | Roles | Descrição |
|---|---|---|---|
| GET | `/users` | ADMIN | Lista todos os utilizadores (sem password) |
| POST | `/users` | ADMIN | Cria utilizador (valida role, hash password) |
| PATCH | `/users/:id` | ADMIN | Actualiza (password opcional) |

### Rotas
| Método | Rota | Roles | Descrição |
|---|---|---|---|
| GET | `/routes/daily` | ADMIN, MOTORISTA | Rota optimizada do dia |

---

## Algoritmo de Roteirização (Módulo D)

- **Depósito:** `{ lat: 38.7223, lon: -9.1393 }` — Lisboa
- **Velocidade média:** 40 km/h
- **Fórmula de distância:** Haversine
- **Algoritmo:** Nearest-neighbor greedy com score = `travelMinutes + windowPenalty`
- **Penalidade de janela:** +0 se dentro da janela, +500 min se após `deliveryWindowEnd`
- **Tempo de serviço:** +15 min por paragem
- **Hora de saída:** 06:00

---

## Dependências Chave

### Backend
```
express@^5.2     prisma@^5.22     @prisma/client@^5.22
bcrypt@^6        jsonwebtoken@^9  pdfkit@^0.18
cors             dotenv
```

### Frontend
```
react@^18        react-dom@^18    react-router-dom@^7
axios@^1.14      react-signature-canvas@^1.1.0-alpha.2
vite@^8          (tailwindcss instalado mas NÃO UTILIZADO)
```

---

## Ficheiros Legados (não utilizar)

Existem no repositório mas não estão ligados a nenhuma rota activa:

- `frontend/src/pages/Dashboard.jsx` — substituído por `AdminDashboard.jsx`
- `frontend/src/pages/NewOrder.jsx` — substituído por `OrderEntry.jsx`
- `frontend/src/components/Inventory/ContainerCard.jsx`
- `frontend/src/components/Inventory/ContainerMap.jsx`
- `frontend/src/components/Inventory/InventoryList.jsx`
- `frontend/src/components/Orders/OrderForm.jsx`
- `frontend/src/components/Orders/ProductSelector.jsx`

---

## Regras de Desenvolvimento

1. **Nunca usar Tailwind** — está instalado mas não é utilizado. CSS Modules apenas.
2. **CSS Modules** — cada componente/página tem o seu `.module.css` na mesma pasta.
3. **Logo** — usar `logo-saab.png` (transparente), NÃO o SVG.
4. **Boolean com default** — usar `!== false` (não truthy check) para campos com `@default(true)`.
5. **Rotas Express** — rotas específicas (`/orders/clients`) ANTES de parametrizadas (`/:id`).
6. **Token para PDF** — `window.open(url?token=JWT)` porque `window.open` não suporta headers.
7. **Transação Prisma** — `prisma.$transaction` para criação de pedidos (validação + decremento atómico).
8. **Nested routes** — layouts usam `<Outlet />`, rotas filhas no `App.jsx`.
9. **Reiniciar backend** — após mudanças no schema ou código, reiniciar o servidor (ou `docker compose up --build -d`).
