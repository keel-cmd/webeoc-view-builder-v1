# WebEOC View Builder

A drag-and-drop form and view builder for WebEOC, built with Next.js 14, TypeScript, Tailwind CSS, and Prisma.

## Features

- **Drag-and-drop builder canvas** — drag components from the sidebar onto the canvas
- **Component sidebar** with 18 built-in components organized by category (Layout, Form, Display)
- **Layout components**: Section, Row, Column, Tabs, Panel
- **Form components**: Text Input, Text Area, Number, Dropdown, Checkbox, Radio, Date, Email, Phone, File Upload
- **Display components**: Label, Button, Image
- **Properties panel** — click any component to configure its settings
- **Preview mode** — renders the live form from the JSON schema
- **Save / Load projects** — persisted to PostgreSQL via Prisma
- **Export schema as JSON** — download the schema file
- **Import schema from JSON** — load any compatible schema file
- **Component registry** — add new components without rewriting the builder

## Architecture

```
src/
├── app/
│   ├── api/
│   │   └── projects/          # REST API routes (GET, POST, PUT, DELETE)
│   │       └── [id]/
│   ├── layout.tsx
│   └── page.tsx
├── builder/
│   ├── BuilderContext.tsx     # Global state (useReducer + Context)
│   ├── BuilderShell.tsx       # Top-level builder with DnD orchestration
│   ├── BuilderCanvas.tsx      # Drop target canvas
│   ├── ComponentSidebar.tsx   # Draggable component palette
│   └── PropertiesPanel.tsx    # Component settings editor
├── renderer/
│   └── SchemaRenderer.tsx     # Renders JSON schema → React UI
├── registry/
│   └── index.ts               # Component registry (register / get / list)
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   └── schemaHelpers.ts       # Schema CRUD utility functions
└── types/
    └── index.ts               # Shared TypeScript types

prisma/
└── schema.prisma              # Database models: User, Project, ProjectVersion, Schema

examples/
└── incident-report.schema.json  # Example schema you can import
```

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/KyleCondren-EM/webeoc-view-builder-v1
cd webeoc-view-builder-v1
npm install
```

### 2. Configure the database

```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL
```

### 3. Run migrations

```bash
npx prisma migrate dev --name init
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the `DATABASE_URL` environment variable (e.g. from [Neon](https://neon.tech) or [Supabase](https://supabase.com))
4. Deploy — the build command runs `prisma generate && next build` automatically

## Adding New Components

1. Open `src/registry/index.ts`
2. Call `registerComponent({ type, label, category, icon, defaultProps, propertyDefinitions, acceptsChildren? })`
3. Add a `case "your-type":` block in `src/renderer/SchemaRenderer.tsx`
4. Optionally add a preview in `src/builder/BuilderCanvas.tsx` → `ComponentPreview`

That's it — the sidebar, properties panel, and schema system automatically pick up the new component.
