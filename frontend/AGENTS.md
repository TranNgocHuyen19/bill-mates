# Next.js Best Practices for AI Agents

A machine-readable companion for AI coding agents working in this Next.js frontend project.
Same rules, structured for fast pattern matching.

---

## Compatibility Matrix

Pin to these versions or newer.

| Dependency         | Version | Notes                                                  |
| ------------------ | ------- | ------------------------------------------------------ |
| Next.js            | 16.0    | App Router format, server actions, and dynamic caching |
| React              | 19.0    | Server components by default, actions, use() API       |
| Tailwind CSS       | 4.0     | CSS-first engine, no tailwind.config.js                |
| Shadcn/UI          | v4      | Component registry and modular UI                      |
| TanStack Query     | v5      | For server state caching and client-side requests      |
| Zod                | v3      | Schema validation for forms and environment variables  |
| Zustand            | v5      | For client-side global state management                |
| PyJWT / jwt-decode | v4      | For decoding JWT claims on the client                  |

---

## Project Structure

We follow a **Feature-Based Architecture**. Code must be grouped by business domain (features) rather than technical type, except for global shared modules.

```
frontend/
├── app/                  # Routes, layouts, and Next.js Route Handlers ONLY
│   ├── api/              # Route Handlers (e.g. api/auth/login)
│   ├── layout.tsx        # Global layout
│   ├── page.tsx          # Root landing page
│   └── globals.css       # Global styles (Tailwind v4 imports)
├── features/             # Feature modules (Strictly isolated by business context)
│   ├── auth/             # Authentication domain
│   │   ├── api/          # Feature-specific fetch functions
│   │   ├── components/   # Presentational UI components for auth
│   │   ├── hooks/        # Feature-specific client hooks
│   │   ├── queries/      # React Query hooks (useQuery, useMutation)
│   │   ├── schemas/      # Feature-specific Zod schemas (LoginFormSchema)
│   │   ├── context/      # React Context for auth if needed
│   │   └── index.ts      # Barrel export (The public API of the feature)
│   ├── user/             # User profiles domain
│   ├── rooms/            # Room management domain
│   └── expenses/         # Expense management domain
├── components/           # Global, reusable UI components
│   ├── ui/               # Atomic shadcn/ui components
│   └── layout/           # Shared page layouts (navbar, sidebar, footer)
├── services/             # Global API connection layer
│   ├── api.ts            # Centralized Axios client wrapper
│   └── endpoints.ts      # Centralized API endpoints list
├── lib/                  # Shared utilities and configurations
│   ├── utils.ts          # Shadcn cn helper
│   └── config.ts         # Zod-validated envConfig
├── store/                # Shared global states (Zustand)
├── hooks/                # Global custom hooks
└── types/                # Global TypeScript definitions
```

---

## Core Conventions

### 1. Feature-Based Isolation

- All logic belonging to a business domain must stay inside its folder under `features/`.
- **Barrel exports**: Each feature must have an `index.ts` that acts as the public API. Other modules can **only** import from ` '@/features/{feature_name}'`.
- **DO NOT** do deep imports such as `import { LoginForm } from '@/features/auth/components/login-form'`.
- **DO** import via barrel: `import { LoginForm } from '@/features/auth'`.

### 2. UI & Logic Separation

- Do not put fetching logic, complex React Query hooks, or Zod schemas directly inside presentational UI component files.
- Offload API queries to `features/{feature}/queries/use-queries.ts` or `use-mutations.ts`.
- Offload schemas to `features/{feature}/schemas/`.

### 3. Environment Variables & Configurations

- Do not reference `process.env` directly in application components.
- Always validate environment variables in `lib/config.ts` using Zod, and import `envConfig` instead.

### 4. Internationalization (i18n)

- **i18n is explicitly disabled.** Write UI texts, labels, and error messages directly in Vietnamese/English in the code without utilizing multi-language packages.

### 5. Tailwind CSS v4 Conventions

- Do not create `tailwind.config.js`. Tailwind v4 uses CSS configuration directives (`@theme`) inside `app/globals.css`.

---

## Anti-patterns & Rules

| Anti-pattern                                             | Why it is wrong                                 | Fix                                                                        |
| -------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| Deep imports across features                             | Tight coupling, breaks domain isolation.        | Export from `features/{name}/index.ts` and import via `@/features/{name}`. |
| Directly using `process.env`                             | No type safety, failures occur late at runtime. | Use `envConfig` from `lib/config.ts`.                                      |
| Writing inline fetch/axios calls in page/component files | Hard to maintain and mock.                      | Put API requests in `services/` or `features/{name}/api/`.                 |
| Adding i18n configurations                               | Project requirement explicitly forbids it.      | Write UI texts statically.                                                 |
| Creating `tailwind.config.js` in Tailwind v4             | Ignored by Tailwind v4.                         | Configure themes in `app/globals.css` using `@theme`.                      |
