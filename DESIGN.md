# TodoApp — Design Document

> Portfolio fullstack project: React + Node.js/Express + PostgreSQL + Socket.io

---

## Understanding Summary

- **What**: A fullstack todo app with ambitious features — authentication, CRUD, categories/tags, priorities, due dates, search/filters, drag-and-drop reordering, and real-time cross-tab sync
- **Why**: Portfolio/demo project to showcase fullstack engineering skills to potential employers
- **Who**: Single developer as demonstrator; demo users exercise all features
- **Stack**: React (Vite) + Node.js/Express + PostgreSQL + Socket.io + Zustand
- **UI**: Custom, polished, premium — dark mode default, animations (Framer Motion), micro-interactions
- **Deployment**: Local only via Docker Compose + polished README
- **Non-goals**: Live cloud hosting, multi-user collaboration/sharing, mobile app, automated test suite

---

## Assumptions

| # | Assumption |
|---|---|
| 1 | Authentication uses JWT stored in httpOnly cookies (secure, protects against XSS) |
| 2 | Database schema managed with Knex.js migrations |
| 3 | Performance target: sub-200ms API responses — demo scale only |
| 4 | No automated tests (portfolio focus is features + architecture) |
| 5 | Docker Compose orchestrates frontend dev server, Express API, and PostgreSQL |
| 6 | Drag-and-drop reordering is persisted via an `order_index` integer field |
| 7 | Dark mode is the default theme |

---

## Architecture

### Chosen Approach: Monorepo with Separate Client/Server

```
/todo-app
  /client                  ← React app (Vite + React Router)
  │  /src
  │    /components         ← Reusable UI components
  │    /pages              ← Route-level views (Login, Dashboard)
  │    /hooks              ← Custom React hooks (useTodos, useSocket, useAuth)
  │    /store              ← Global state (Zustand)
  │    /api                ← Axios client + API call functions
  │    /styles             ← Global CSS / design tokens
  │  index.html
  │  vite.config.js
  │
  /server                  ← Express API
  │  /src
  │    /routes             ← auth.routes.js, todos.routes.js
  │    /controllers        ← Logic per route group
  │    /middleware         ← authGuard, errorHandler, validate
  │    /db                 ← Knex config + migrations + seeds
  │    /socket             ← Socket.io event handlers
  │  index.js
  │
  docker-compose.yml
  .env.example
  README.md
```

**Flow:**
- React ↔ Express over REST (`/api/v1/...`)
- Socket.io on the same Express port (HTTP upgrade)
- PostgreSQL is the single source of truth
- Zustand is the single source of truth on the client

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,        -- bcrypt hash
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (per user, mutually exclusive on a todo)
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  color       VARCHAR(7) NOT NULL           -- hex color e.g. "#6C63FF"
);

-- Todos
CREATE TABLE todos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  priority    VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')),
  due_date    TIMESTAMPTZ,
  completed   BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,   -- drag-and-drop sort order
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (many-to-many with todos)
CREATE TABLE tags (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name    VARCHAR(50) NOT NULL,
  UNIQUE (user_id, name)                    -- prevent duplicate tag names per user
);

CREATE TABLE todo_tags (
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);
```

---

## API Design

**Base URL:** `/api/v1`

### Auth Routes
```
POST   /auth/register     → Create account (name, email, password)
POST   /auth/login        → Returns JWT in httpOnly cookie
POST   /auth/logout       → Clears cookie
GET    /auth/me           → Returns current user (validates token)
```

### Todo Routes *(protected)*
```
GET    /todos             → List todos (?category=, ?tag=, ?priority=, ?search=, ?completed=)
POST   /todos             → Create todo
GET    /todos/:id         → Get single todo
PATCH  /todos/:id         → Update todo (partial)
DELETE /todos/:id         → Delete todo
PATCH  /todos/reorder     → Bulk update order_index after drag-and-drop
```

### Category & Tag Routes *(protected)*
```
GET    /categories        → List user's categories
POST   /categories        → Create category
DELETE /categories/:id    → Delete category

GET    /tags              → List user's tags
POST   /tags              → Create tag
DELETE /tags/:id          → Delete tag
```

**Consistent error response shape:**
```json
{
  "success": false,
  "message": "Todo not found",
  "code": "TODO_NOT_FOUND"
}
```

---

## Real-Time Design (Socket.io)

**Connection flow:**
1. After login, the React client connects to Socket.io (JWT cookie auto-sent)
2. Server validates token on `connection` — unauthorized sockets immediately disconnected
3. Each user joins their private room: `user:{id}`

**Server → Client events:**
```
todo:created   { todo }       → New todo added
todo:updated   { todo }       → Todo edited or completed toggled
todo:deleted   { id }         → Todo removed
todo:reordered { todos[] }    → Order changed via drag-and-drop
```

**Cross-tab sync flow:**
1. Tab A creates a todo → `POST /todos`
2. Express saves to DB → emits `todo:created` to `user:{id}` room
3. All connected tabs receive event → Zustand store updated instantly

**Client hooks:**
```
/hooks/useSocket.js   → Connects on mount, disconnects on unmount
/hooks/useTodos.js    → Listens to socket events, updates Zustand store
```

---

## Frontend UI Design

### Pages & Routes
```
/login    → Auth page (login + register tabs)
/         → Dashboard (protected route)
```

### Dashboard Layout
```
┌─────────────────────────────────────────────────┐
│  Sidebar          │  Main Panel                  │
│  ─────────────    │  ─────────────────────────   │
│  📋 All Todos     │  [ Search bar ]  [+ Add]     │
│  ✅ Completed     │                              │
│                   │  Filters: Priority | Due |   │
│  CATEGORIES       │          Status  | Tag       │
│  > Work           │                              │
│  > Personal       │  ┌──────────────────────┐   │
│  + Add Category   │  │ ⠿ Todo Card          │   │
│                   │  │   tag  🔴 High  📅    │   │
│  TAGS             │  └──────────────────────┘   │
│  # urgent         │  ┌──────────────────────┐   │
│  # work           │  │ ⠿ Todo Card          │   │
│  + Add Tag        │  └──────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Design System
| Token | Value |
|---|---|
| Background | `#0F1117` (deep navy) |
| Surface / cards | `#1A1D27` |
| Accent | `#6C63FF` (purple) |
| Danger | `#FF4C4C` |
| Success | `#4CAF50` |
| Font | `Inter` (Google Fonts) |
| Animation library | Framer Motion |
| Drag-and-drop | @dnd-kit/core |
| Icons | Lucide React |

### Key UI Interactions
| Interaction | Implementation |
|---|---|
| Add todo | Inline input expands into full form (slide-down animation) |
| Complete todo | Checkbox with strike-through animation + particle burst |
| Drag reorder | Ghost card preview, snap-to-position on drop |
| Delete | Trash icon with confirmation toast |
| Real-time sync | Subtle "synced" badge in header |
| Overdue todos | Due date displayed in red |

---

## Error Handling

### Server
- Centralized error handler middleware (`/middleware/errorHandler.js`)
- Auth guard validates JWT on all protected routes
- Unauthorized cross-user access returns `403` (not `404` — never reveal data existence)
- DB errors return `500` with a generic message (internals never exposed)

### Client
- Axios interceptor catches `401` globally → auto-logout + redirect to `/login`
- Optimistic updates: failed requests automatically revert Zustand state + show error toast
- Socket disconnect → reconnection indicator in header; local state preserved until reconnect

### Edge Cases
- Drag-and-drop with 1 todo → reorder is a no-op
- Deleting a category → todos become uncategorized (`SET NULL`)
- Due date in the past → flagged visually as overdue, not blocked
- Duplicate tag names → prevented at DB level (unique constraint)

---

## Docker Setup

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: todoapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data

  server:
    build: ./server
    ports: ["4000:4000"]
    environment:
      DATABASE_URL: postgres://admin:secret@postgres:5432/todoapp
      JWT_SECRET: dev_secret_change_in_prod
      CLIENT_URL: http://localhost:5173
    depends_on: [postgres]
    volumes:
      - ./server:/app
      - /app/node_modules

  client:
    build: ./client
    ports: ["5173:5173"]
    environment:
      VITE_API_URL: http://localhost:4000
    depends_on: [server]
    volumes:
      - ./client:/app
      - /app/node_modules

volumes:
  pgdata:
```

**Start everything:** `docker compose up`

**README must include:**
1. Demo GIF at the top
2. Tech stack badges
3. `docker compose up` quick start
4. Feature list with checkmarks
5. Architecture diagram (Mermaid)
6. Brief API reference

---

## Decision Log

| # | Decision | Alternatives Considered | Rationale |
|---|---|---|---|
| 1 | Monorepo with separate client/server | Unified server serving frontend; tRPC layer | Best mirrors real-world structure; clearest portfolio signal |
| 2 | Vite for React tooling | Create React App, Next.js | CRA is deprecated; Next.js adds SSR complexity not needed here |
| 3 | Zustand for state management | Redux Toolkit, Context API | Lightweight, modern, minimal boilerplate; right scale for this project |
| 4 | Knex.js for DB access | Prisma, raw pg, Sequelize | Balances SQL control with migration support; Prisma adds schema complexity |
| 5 | JWT in httpOnly cookie | JWT in localStorage, sessions | HttpOnly prevents XSS token theft; shows security awareness |
| 6 | UUIDs as primary keys | Serial integers | Prevents enumerable IDs in REST responses |
| 7 | @dnd-kit for drag-and-drop | react-beautiful-dnd | RBD is deprecated; dnd-kit is the modern successor |
| 8 | Framer Motion for animations | CSS transitions, React Spring | Best DX and most portfolio-impressive results |
| 9 | Socket.io private rooms for real-time | Polling, SSE, broadcast | Rooms isolate per-user data; Socket.io is battle-tested |
| 10 | Bulk reorder endpoint (`PATCH /todos/reorder`) | One request per moved item | Single request after drag ends avoids N HTTP calls |
| 11 | Categories = singular, Tags = many-to-many | Everything as tags | Mirrors real app patterns; shows relational thinking |
| 12 | Docker Compose with hot reload | Static build containers | Dev DX matters; proves you can set up a real dev environment |
