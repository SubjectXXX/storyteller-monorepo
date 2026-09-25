# AGENTS.md — Storyteller monorepo (wrapper root)

This is the **deployment wrapper** for the Storyteller stack. It is not where
application code lives.

## 1. Repo layout

| Path | Kind | Owns |
|---|---|---|
| `application/api/`    | git submodule → `SubjectXXX/storyteller-api`    (branch `development`) | Laravel 13 JSON API, canonical state, mechanics, settings, billing, AI/media orchestrator |
| `application/web/`    | git submodule → `SubjectXXX/storyteller-web`    (branch `development`) | Player-facing React 19 SPA |
| `application/admin/`  | git submodule → `SubjectXXX/storyteller-admin`  (branch `development`) | Admin SPA |
| `packages/design-system/` | vendored source (npm workspace, no separate repo) | Shared tokens + primitives |
| `infra/`              | wrapper-owned | Caddy gateway + per-app Dockerfiles + entrypoints |
| `compose.yaml`, `.env.example`, `DEPLOY.md`, `README.md` | wrapper-owned | Orchestration + ops docs |

The submodule subdirectories each carry their own nested `AGENTS.md` that
overrides this one for paths inside that subtree.

## 2. Where to make changes (hard rule)

- **Application code → edit inside the submodule, on its own branch, push there.** Never write Laravel / React / admin code in the wrapper.
- **Wrapper-only concerns** (compose stack, gateway Caddyfile, per-app Dockerfiles, shared infra scripts, deployment docs, `.env.example`) → edit at the wrapper root.
- **`packages/design-system/` is vendored at the wrapper level** — changes there are wrapper commits; downstream apps pick them up via the npm workspace link, not via a submodule bump.

If unsure which side owns a change, ask before editing.

## 3. Submodule bump workflow

After pushing a commit to a submodule:

```bash
# inside the submodule
git push origin <branch>

# back at the wrapper root
cd <repo root>
git add application/<api|web|admin>      # updates the submodule pointer
git commit -m "chore(submodule): bump <api|web|admin> to <short-sha> (<reason>)"
git push
```

Wrapper commits that touch a submodule pointer follow the
`chore(submodule): bump <name> to <sha> (...)` convention — see `git log` on
`main` for examples.

Use `git submodule update --remote --merge` only when intentionally tracking
the tip of `development`; use a tag / explicit SHA when bumping to a release.

## 4. CI

The wrapper has **no top-level CI**. Each submodule is independently verified
by its own `.github/workflows/ci.yml`. Push green to the submodule first,
then bump the wrapper — a red submodule will not block a wrapper-only PR but
will block any deployment that pulls that pointer.

## 5. Quality gates / local commands

- Wrapper-level: `docker compose build`, `docker compose up -d`, gateway smoke
  tests (`curl -fsS http://localhost:8088/health/up`).
- Per-app gates, stack pins, and hard rules live in each submodule's
  `AGENTS.md`. Read that file before editing inside the submodule.
