---
description: Checklist before Vercel deployment and production deployment procedures
---

# Deployment Workflow

Vercel-based deployment procedure. Follows the `develop` → `main` branch strategy.

---

## Branching Strategy

| Branch | Environment | Purpose |
|--------|-------------|---------|
| `feature/*` | — | Feature development |
| `develop` | Preview (Staging) | Integration testing |
| `main` | Production | Production deployment |

```
feature/* → develop (PR merge) → main (Release PR)
```

---

## Step 1: Local Verification

All verification checks must pass locally before deployment.

```bash
// turbo
npx tsc --noEmit
// turbo
npm run lint
// turbo
npm run test:run
// turbo
npm run build
```

---

## Step 2: Merge to develop Branch

Merge the feature branch into `develop`.

```bash
git checkout develop
git merge feature/[name]
git push origin develop
```

> Vercel will automatically create a Preview deployment.

---

## Step 3: Check CI Pipeline

GitHub Actions CI (`.github/workflows/ci.yml`) will run automatically:

1. **Security Audit** — `npm audit`
2. **CodeQL Analysis** — Code security analysis
3. **Secrets Scan** — Gitleaks
4. **Lint & Type Check** — ESLint + `tsc --noEmit`
5. **Unit Tests** — `npm run test:unit`
6. **Integration Tests** — Integration tests including PostgreSQL
7. **Build** — `npm run build`

> All CI checks must pass before merging into `main`.

---

## Step 4: Preview Environment Testing

Manually verify the Vercel Preview URL:

- [ ] Core pages accessible
- [ ] Authentication flows work
- [ ] API endpoints respond correctly
- [ ] Responsive layouts check out (Mobile/Tablet/Desktop)

---

## Step 5: Production Deployment (Merge to main)

```bash
git checkout main
git merge develop
git push origin main
```

> Vercel will automatically perform the Production deployment.

---

## Step 6: DB Migration (If necessary)

If there are schema changes, apply the migration to the production DB:

```bash
# GitHub Actions or manual execution
npx prisma migrate deploy
```

> See `.github/workflows/migrate.yml`

---

## Step 7: Production Verification

- [ ] Check Sentry error monitoring
- [ ] Verify Vercel Analytics is functioning
- [ ] Perform smoke tests on core features

---

## Rollback

If problems occur:

```bash
# Rollback to a previous deployment in the Vercel dashboard
# OR
scripts/rollback.sh
```

For DB migration rollbacks, refer to `docs/deployment/ROLLBACK_STRATEGY.md`.

---

## Environment Variable Management

- **Local**: `.env.local`
- **Preview**: Vercel Environment Variables (See `.env.vercel`)
- **Production**: Vercel Environment Variables (See `.env.prod`)

> When adding new environment variables, update the Vercel dashboard and `.env.example` simultaneously.
