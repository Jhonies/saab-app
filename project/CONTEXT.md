# CONTEXT.md — SAAB Gestão Logística
> Snapshot do estado actual do projecto. Actualizar sempre que um módulo for concluído.
> Última actualização: 2026-03-28

---

## Status do Projecto

| Módulo | Estado | Descrição |
|---|---|---|
| Auth / JWT | ✅ Completo | Login funcional, token 8h, role-based redirect |
| Banco de Dados | ✅ Completo | SQLite via Prisma 5.22, migration aplicada, seed pronto |
| Seed de Dados | ✅ Completo | Admin + 3 clientes + 7 produtos + 12 contêineres |
| Módulo A — Inventário | ✅ Completo | Grid 12 slots, busca com glow azul, barra de progresso |
| Módulo B — Pedidos | ✅ Completo | Formulário + transação Prisma + validação de stock |
| Módulo C — Faturamento | ✅ Completo | PDF pdfkit + assinatura digital react-signature-canvas |
| Módulo D — Roteirização | ✅ Completo | Haversine + nearest-neighbor + janelas de entrega |
| Layout Admin | ✅ Completo | Sidebar persistente (Outlet), topbar, nav activo por URL |

---

## Credenciais de Teste

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@saab.com | 123456 |
| CLIENTE | frigorifico.norte@saab.com | 123456 |
| CLIENTE | distribuidora.sul@saab.com | 123456 |
| CLIENTE | supermercado.abc@saab.com | 123456 |

---

## Arquitectura

```
backend/   → Express 5 na porta 3000
frontend/  → React 19 + Vite na porta 5173
```

### Backend — Fluxo de pedido HTTP
```
Request → authMiddleware (verifica JWT header ou ?token=)
        → authorizeRoles (valida role)
        → Controller (parse HTTP)
        → Service (lógica de negócio / Prisma)
        → Response JSON
```

### Frontend — Fluxo de autenticação
```
Login → AuthContext.login()
      → POST /auth/login
      → JWT guardado em localStorage
      → axios interceptor injeta Bearer em todos os pedidos
      → redirect para /admin/dashboard | /cliente/catalog | /motorista/routes
```

### Layout Admin (React Router v6 nested routes)
```
/admin  →  ProtectedRoute [ADMIN]
            └── AdminDashboard (layout shell: sidebar + topbar + <Outlet />)
                  ├── /admin/dashboard   → AdminHome (welcome + stats)
                  ├── /admin/inventory   → Inventory → InventoryGrid
                  ├── /admin/orders/new  → OrderEntry
                  ├── /admin/logistics   → Logistics
                  └── /admin/routes      → DriverRoutes
```

---

## Identidade Visual

| Token | Hex | Uso |
|---|---|---|
| bg-page | `#1a1a1a` | Fundo de todas as páginas |
| bg-surface | `#1e1e1e` | Cards, painéis |
| bg-sidebar | `#0d1b2a` | Sidebar azul naval/metálico |
| bg-input | `#2a2a2a` | Inputs e selects |
| border-sidebar | `#1a3a5c` | Bordas da sidebar |
| red-base | `#8b0000` | Botões primários, foco, badges activos |
| red-dark | `#3d0000` | Headers de cards críticos |
| text-primary | `#f0f0f0` | Títulos e conteúdo principal |
| glow-blue | `#1a6bb5` | Highlight de busca no InventoryGrid |

**Regra absoluta:** CSS Modules exclusivamente. Sem Tailwind, sem CSS inline, sem styled-components.

---

## Base de Dados — Modelos Prisma

```
User          id, email (unique), password, role, orders[], createdAt, updatedAt
Product       id, name, type, pricePerBox, containers[], orderItems[]
Container     id, label (unique), capacity, quantity, productId?, product?, orderItems[]
Order         id, clientId, status, totalBoxes, address, lat?, lon?,
              deliveryWindowStart, deliveryWindowEnd, signature?, deliveredAt?,
              deliveredById?, items[]
OrderItem     id, orderId, containerId, productId, quantity
```

**Roles válidos (String no SQLite):** `ADMIN` | `CLIENTE` | `MOTORISTA`
**Status válidos (String no SQLite):** `PENDING` | `CONFIRMED` | `DELIVERED` | `CANCELLED`

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
| GET | `/inventory/products` | ADMIN, CLIENTE | Lista produtos |

### Pedidos
| Método | Rota | Roles | Descrição |
|---|---|---|---|
| GET | `/orders/clients` | ADMIN | Lista utilizadores CLIENTE |
| GET | `/orders/:id/invoice` | ADMIN, CLIENTE | Descarrega PDF (aceita `?token=`) |
| PATCH | `/orders/:id/deliver` | ADMIN, MOTORISTA | Regista entrega + assinatura |
| GET | `/orders` | ADMIN, CLIENTE, MOTORISTA | Lista pedidos |
| POST | `/orders` | ADMIN | Cria pedido (transação Prisma) |
| GET | `/orders/:id` | ADMIN, CLIENTE, MOTORISTA | Detalhe de pedido |

### Rotas
| Método | Rota | Roles | Descrição |
|---|---|---|---|
| GET | `/routes/daily` | ADMIN, MOTORISTA | Rota optimizada do dia (nearest-neighbor) |

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
react@^19        react-dom@^19    react-router-dom@^7
axios@^1.14      react-signature-canvas@^1.1.0-alpha.2
vite@^8          (tailwindcss instalado mas NÃO UTILIZADO)
```

---

## Ficheiros Legados (não utilizar)

Existem no repositório mas não estão ligados a nenhuma rota activa:

- `frontend/src/pages/Dashboard.jsx` — substituído por `AdminDashboard.jsx`
- `frontend/src/pages/NewOrder.jsx` — substituído por `OrderEntry.jsx`
- `frontend/src/components/Inventory/ContainerCard.jsx` — placeholder inicial
- `frontend/src/components/Inventory/ContainerMap.jsx` — placeholder inicial
- `frontend/src/components/Inventory/InventoryList.jsx` — placeholder inicial
- `frontend/src/components/Orders/OrderForm.jsx` — placeholder inicial
- `frontend/src/components/Orders/ProductSelector.jsx` — placeholder inicial

---

## Regras de Desenvolvimento

1. **Nunca usar Tailwind** — está instalado como dependência dev mas não deve ser usado.
2. **CSS Modules** — cada componente/página tem o seu `.module.css` na mesma pasta.
3. **Rotas específicas antes de parametrizadas** — no Express, `/orders/clients` e `/orders/:id/invoice` devem vir ANTES de `/:id`.
4. **Parar o servidor antes de `npx prisma generate`** — o Windows bloqueia a DLL do query engine enquanto o servidor está activo.
5. **Token no query param para PDF** — `window.open(url?token=JWT)` porque `window.open` não suporta headers Authorization.
6. **Prisma transação para pedidos** — `prisma.$transaction` garante atomicidade na validação e decremento de stock.
7. **Nested routes no React Router v6** — `AdminDashboard` usa `<Outlet />`, as rotas admin são filhas da rota `/admin` no `App.jsx`.
