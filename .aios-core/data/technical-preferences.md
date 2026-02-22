# User-Defined Preferred Patterns and Preferences

## Tech Presets

AIOS provides pre-defined architecture presets for common technology stacks.
Location: `.aios-core/data/tech-presets/`

### Available Presets

| Preset         | Technologies                                                   | Best For                                         |
| -------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| `nextjs-react` | Next.js 14+, React, TypeScript, Tailwind, Zustand, React Query | Fullstack web apps, SaaS, E-commerce, Dashboards |
| `react-vite-supabase` | React 19, Vite 7, Supabase, CSS Modules, Context API | PWA mobile-first, BaaS apps, Real-time apps |

### How to Use Presets

1. **During Architecture Creation:**
   - When using `@architect *create-doc architecture`, the template will prompt for preset selection
   - Load the preset file to get detailed patterns, standards, and templates

2. **During Development:**
   - Reference the preset when asking `@dev` to implement features
   - Example: "Follow the react-vite-supabase preset patterns for this service"

3. **Creating New Presets:**
   - Copy `_template.md` and fill in technology-specific details
   - Add to the table above when complete

### Preset Contents

Each preset includes:

- **Design Patterns:** Recommended patterns with examples
- **Project Structure:** Folder organization
- **Tech Stack:** Libraries and versions
- **Coding Standards:** Naming conventions, critical rules
- **Testing Strategy:** What to test, coverage goals
- **File Templates:** Ready-to-use code templates

## Active Preset

> **Current:** `react-vite-supabase` (React 19, Vite 7, Supabase, CSS Modules, Context API)

The active preset is automatically loaded when @dev is activated. To change:

```yaml
# .aios-core/core-config.yaml
techPreset:
  active: react-vite-supabase # Change to another preset name
```

---

## User Preferences

### Preferred Technologies

| Category | Preference | Notes |
|----------|------------|-------|
| Frontend Framework | React 19.2.0 | SPA with client-side routing |
| Bundler | Vite 7.2.4 | Fast HMR, ESM native |
| Routing | React Router DOM 7.12 | Client-side routing |
| Backend/BaaS | Supabase | PostgreSQL + Auth + Realtime + Edge Functions + RLS |
| Styling | CSS Modules / Inline styles | No Tailwind |
| State Management | React Context API | 5 contexts: Auth, Transactions, Cards, Goals, Dashboard |
| Icons | Lucide React | Consistent icon library |
| Date handling | date-fns | Timezone-safe with custom dateUtils |
| CSV parsing | PapaParse | Import/export CSV |
| PDF parsing | pdfjs-dist | Invoice import |
| Testing | Vitest + Testing Library | Co-located tests, jsdom environment |
| Deploy | Vercel | CDN + serverless |
| Language | JavaScript (JSX) | No TypeScript (planned as separate future PRD) |

### Coding Style Preferences

- Prefer functional components over class components
- Use named exports for hooks, default exports for components
- Feature-based directory structure: `src/features/{name}/`
- Custom hooks wrapping Context: `src/hooks/use{Name}.js`
- Co-located tests: `*.test.js` alongside source files
- Haptic feedback on mobile interactions
- Mobile-first responsive design
- 2 decimal places for all financial calculations

### Project-Specific Rules

- All database tables MUST have RLS policies enabled
- Supabase RPC functions for complex cross-table operations
- 5-minute cache TTL for data contexts
- Service Worker for PWA offline support
- Web Push API with VAPID keys for notifications
- Apple Design Language: 20px border-radius cards, #5100FF primary color

---

_Updated: 2026-02-21_
