# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```





Backend/
├── venv/                          # Virtual environment (gitignored)
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app, startup hook, route mounting (Day 1)
│   ├── config.py                  # pydantic-settings (Day 2)
│   ├── database.py                # Async engine + session + Base (Day 2)
│   │
│   ├── models/                    # SQLAlchemy ORM models (Day 3)
│   │   ├── __init__.py            # imports all models so Base.metadata sees them
│   │   ├── enums.py               # UserRole, EventStatus, RsvpStatus, etc.
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── event.py
│   │   ├── rsvp.py
│   │   ├── comment.py
│   │   ├── report.py
│   │   └── notification.py
│   │
│   ├── schemas/                   # Pydantic request/response models (Day 6+)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── event.py
│   │   ├── rsvp.py
│   │   ├── comment.py
│   │   └── auth.py
│   │
│   ├── core/                      # Cross-cutting auth/security logic
│   │   ├── __init__.py
│   │   ├── security.py            # password hashing, JWT encode/decode (Day 4)
│   │   └── deps.py                # get_current_user, require_admin, require_ownership (Day 4-5)
│   │
│   ├── routers/                   # One file per resource, mounted in main.py
│   │   ├── __init__.py
│   │   ├── auth.py                # /auth/signup, /auth/login (Day 4)
│   │   ├── users.py                # /users/me (Day 5)
│   │   ├── events.py               # /events CRUD + search (Day 6-8)
│   │   ├── rsvps.py                 # /events/{id}/rsvp, waitlist logic (Day 11)
│   │   ├── comments.py              # /events/{id}/comments (Day 14)
│   │   ├── reports.py               # /reports (Day 15)
│   │   ├── admin.py                  # /admin/* — reports, users, categories (Day 17-18)
│   │   └── notifications.py          # /users/me/notifications (Day 20)
│   │
│   ├── services/                  # Business logic not tied to one route (Day 19-20)
│   │   ├── __init__.py
│   │   ├── scheduler.py           # APScheduler jobs — reminders, auto-complete
│   │   └── notifications.py       # Email/log delivery logic
│   │
│   └── tests/                     # pytest suite (Day 23)
│       ├── __init__.py
│       ├── test_auth.py
│       ├── test_events.py
│       └── test_rsvp_waitlist.py
│
├── alembic/                       # Migration environment (Day 3)
│   ├── versions/                  # Auto-generated migration files
│   ├── env.py
│   └── script.py.mako
├── alembic.ini
│
├── event_board.db                 # SQLite file (gitignored, dev only)
├── .env                           # gitignored
├── .env.example                   # committed — template for .env
├── .gitignore
├── requirements.txt
└── Dockerfile                     # Day 24 — production build