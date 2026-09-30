# Cappy Hub

Cappy Hub is an internal administrative web application for the **Coding Interview Club (CIC)**.

It provides one place for CIC officers to manage:

- Officers
- Events
- Event participation
- Points
- Warnings
- Administrative activity

The goal is to keep CIC's administrative workflows simple, consistent, and easy to maintain.

## Tech Stack

- Next.js
- React
- TypeScript
- Supabase
- PostgreSQL
- Tailwind CSS
- Vitest

## Getting Started

### Requirements

Install:

- Node.js 24
- npm
- Git
- Docker Desktop for local database testing

Clone the repository:

```bash
git clone https://github.com/ehuerta6/cappy-hub.git
cd cappy-hub
```

Install dependencies:

```bash
npm ci
```

### Environment Variables

Create a `.env.local` file:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Ask a Cappy Hub maintainer for the development environment values if needed.

Never commit:

- `.env.local`
- passwords
- API secrets
- OAuth secrets
- Supabase service-role keys
- any other private credentials

### Run the Application

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## Contributing

Contributions from CIC members are welcome.

If you want to add a feature or make a larger change, **open a GitHub Issue first** so we can agree on the problem and scope before implementation begins.

Good contributions include:

- Bug fixes
- Usability improvements
- Accessibility improvements
- Tests
- Documentation
- Small refactors
- Features that improve existing Cappy Hub workflows

Try to keep contributions focused on the existing application rather than introducing unrelated systems.

---

## Development Workflow

### 1. Start From the Latest `main`

```bash
git switch main
git pull
```

### 2. Create a Branch

Do not develop directly on `main`.

Create a short-lived branch:

```bash
git switch -c feat/event-filters
```

Use one of these prefixes:

```text
feat/       new functionality
fix/        bug fixes
docs/       documentation
refactor/   code restructuring
chore/      maintenance
ci/         CI changes
```

Examples:

```text
feat/officer-search
fix/event-signup-state
docs/update-readme
refactor/points-query
```

### 3. Make Your Changes

Keep changes focused on one problem.

Prefer a small Pull Request that solves one thing well over a large PR containing unrelated changes.

If your change modifies the database, use a migration instead of manually changing the schema.

Create a migration with:

```bash
npx supabase migration new descriptive_name
```

Database changes should always be reproducible from the repository.

### 4. Run the Checks

Before opening a Pull Request, run:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

To automatically fix formatting:

```bash
npm run format
```

Some database tests require the local Supabase test database:

```bash
npm run db:start
npm test
```

Do not use production data for development or testing.

### 5. Commit Your Work

Use short, meaningful commit messages.

Examples:

```text
feat: add officer search
fix: prevent signup after event closes
docs: improve contributor setup
refactor: simplify points filtering
```

### 6. Push Your Branch

```bash
git push -u origin feat/event-filters
```

Then open a Pull Request into `main`.

---

## Pull Requests

Every Pull Request should explain:

- What problem it solves
- What changed
- How it was tested
- Any important implementation decisions

Include screenshots when the UI changes and they help reviewers understand the change.

### Merge Requirements

`main` is protected.

Contributor Pull Requests must:

- Pass CI
- Receive at least **one approval**
- Resolve review conversations
- Be merged through a Pull Request

Do not force-push or rewrite shared `main` history.

Repository maintainers are responsible for merging approved contributions.

We use **Squash and Merge** so each completed Pull Request becomes one clean commit on `main`.

---

## Keeping Your Branch Updated

If `main` changes while you are working:

```bash
git switch main
git pull
git switch your-branch
git merge main
```

Resolve any conflicts locally, test the result, and push your branch again.

---

## Database Development

Supabase provides Cappy Hub's:

- PostgreSQL database
- Authentication
- Row Level Security
- Database functions
- Scheduled database processing

Database migrations live in:

```text
supabase/migrations/
```

Do not manually recreate schema changes outside migrations.

When database types change, regenerate them with:

```bash
npm run db:types
```

Then verify them with:

```bash
npm run db:types:check
```

### Security Rules

Never:

- Commit credentials
- Put service-role credentials in browser code
- Disable authorization just to make something work
- Rely only on hidden UI controls for permissions
- Modify production data while testing
- Bypass database migrations for schema changes

If your change affects authentication, authorization, Row Level Security, roles, or protected database operations, mention it clearly in your Pull Request.

---

## Useful Commands

```bash
# Development
npm run dev

# Formatting
npm run format
npm run format:check

# Code quality
npm run lint
npm run typecheck

# Tests
npm test

# Production build
npm run build

# Local Supabase database
npm run db:start
npm run db:reset

# Database types
npm run db:types
npm run db:types:check
```

---

## Have an Idea?

Open a GitHub Issue describing:

1. The problem you noticed
2. What you think should change
3. Why it would improve Cappy Hub

You do not need to know exactly how to implement something before proposing it.

If you want to work on an existing Issue, leave a comment so multiple contributors do not accidentally work on the same thing.

---

## Maintainers

Cappy Hub is maintained by the **Coding Interview Club**.

Maintainers review contributions, help clarify expected behavior, and decide what is merged into `main`.

The project should remain understandable and maintainable so future CIC officers can continue improving it.
