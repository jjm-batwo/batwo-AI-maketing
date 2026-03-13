# Vercel Deployment Checklist

Vercel preview and production deployments should follow this checklist before pushing or promoting a release.

## 1. Local Preflight

- [ ] Install exact project dependencies with `npm ci`
- [ ] Verify app runtime code does not import `devDependencies`
  ```bash
  npm run check:prod-deps
  ```
- [ ] Run static validation
  ```bash
  npm run lint
  npm run type-check
  ```
- [ ] Run the minimum regression suite
  ```bash
  npm run test:unit
  ```
- [ ] Confirm the production build still succeeds
  ```bash
  SKIP_ENV_VALIDATION=true npm run build
  ```

## 2. Preview Deployment Readiness

- [ ] Required preview env vars exist in Vercel
- [ ] Prisma schema changes are committed with matching client generation inputs
- [ ] New external packages imported from `src/`, `next.config.ts`, `instrumentation.ts`, `proxy.ts`, or Sentry config are listed in `dependencies`
- [ ] Build-only changes were validated in GitHub Actions `Deployment Readiness` and `Build`

## 3. Production Promotion Readiness

- [ ] Latest preview deployment is healthy
- [ ] `main` branch CI is green, including `Deployment Readiness`
- [ ] Production-only environment variables are verified
- [ ] Rollback target is known in Vercel Deployments

## 4. Fast Failure Guide

| Symptom                                                 | First check                                                                   |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Cannot find module 'package-name'` during `next build` | `npm run check:prod-deps` and `package.json` dependency section               |
| Prisma generate/build mismatch                          | `prisma/schema.prisma`, generated client imports, and `npm run build` locally |
| Works locally, fails only on Vercel                     | Compare env vars, `npm ci`, and CI `Deployment Readiness` job                 |
| Preview passes, production fails                        | Compare Vercel preview vs production env vars and secrets                     |

## 5. Automation Now In Place

- `npm run build` automatically runs `npm run check:prod-deps` first
- `.husky/pre-push` runs the same production dependency guard before unit tests
- GitHub Actions `CI` includes a dedicated `Deployment Readiness` job
- GitHub Actions `Deploy to Production` validates production dependency boundaries before release checks
