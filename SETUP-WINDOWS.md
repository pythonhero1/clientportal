# Windows setup

This guide prepares a new project. Antigravity 2.24.0 is already installed according to Stephen. Git, Node, Python, external accounts and provider capabilities have not been inspected on Stephen's computer.

## 1 Choose the project root

Extract the package into `C:\Projects\oderinde-client-portal`, or another folder Stephen chooses. The folder opened in Antigravity must directly contain `AGENTS.md`, `.agents`, `BUILD-PLAN.md` and `plans`. Avoid opening only a future `apps/web` folder.

Use File Explorer's hidden-item setting if needed to see `.agents`. Keep one root protocol. Do not create a competing root GEMINI.md that repeats and drifts from AGENTS.md.

## 2 Check tools

Run each command in Antigravity's PowerShell terminal:

```powershell
git --version
node --version
npm.cmd --version
py -3 --version
```

Install missing tools from their official sites: Git for Windows, Node.js 24 LTS and Python 3. Restart the terminal after installation. Node includes npm. Use `npm.cmd` and `npx.cmd` on Windows if PowerShell blocks the corresponding script wrappers; do not disable machine-wide execution safeguards to run npm.

Docker Desktop and WSL are optional. They may be useful later for local PostgreSQL or a scanner, but are not prerequisites for the initial Windows workflow. A selected development database can be managed remotely.

## 3 Verify project instructions

Open the exact project folder in Antigravity, start a fresh conversation, and check Customizations for the rules. Both `project-memory.md` and `plan-before-build.md` use `trigger: always_on`; scoped security/UI rules have glob triggers.

Current documentation uses project skills under `.agents/skills/`. Legacy `.agents/workflows/` commands are scheduled to stop on October 19, 2026. This kit deliberately uses skills.

| Skill | Purpose | Plain prompt fallback |
| --- | --- | --- |
| /portal-start | Inspect setup and prepare the first task | Read and follow .agents/skills/portal-start/SKILL.md |
| /portal-plan | Prepare a concrete implementation plan | Read and follow .agents/skills/portal-plan/SKILL.md |
| /portal-build | Execute an approved task | Read and follow .agents/skills/portal-build/SKILL.md |
| /portal-verify | Check changed behavior and release evidence | Read and follow .agents/skills/portal-verify/SKILL.md |
| /portal-release | Prepare a concrete release/rollback candidate | Read and follow .agents/skills/portal-release/SKILL.md |
| /portal-resume | Continue from the recorded plan and evidence | Read and follow .agents/skills/portal-resume/SKILL.md |

Do not assume that listing a skill proves its behavior. Ask the agent to prepare the initial plan and verify that it produces the plan without writing application code.

Run the checker:

```powershell
py -3 tools/check-memory.py
```

## 4 Initialize version control after reviewing P00

The ZIP is a portable source kit, not an existing remote repository. These commands initialize a local repository after Stephen approves that setup task:

```powershell
git init -b main
git status --short
git add AGENTS.md .agents memory plans handoff docs tools
git add BUILD-PLAN.md START-HERE.md START-PROMPT.md SETUP-WINDOWS.md
git add ANALYSIS-PROMPT.md BOOTSTRAP-PROMPT.md CHANGELOG.md
git add .gitignore .gitattributes .env.web.example .env.api.example
git commit -m "Add portal workflow and implementation plan"
```

If Git requests author information, Stephen supplies the name/email for this repository. Do not invent an identity or change global Git configuration. Choose a remote later; none has been created or pushed by this package.

## 5 Proposed application scaffolding after P00 approval

These are the commands for Antigravity to review in P00. They are not commands already run here. Check current CLI help and compatible versions first; record the exact versions resolved.

```powershell
npm.cmd init -y
npm.cmd pkg set private=true --json
npm.cmd pkg set "workspaces[0]=apps/*"
npm.cmd create vite@latest apps/web -- --template react-ts
npx.cmd --yes @nestjs/cli@latest new apps/api --package-manager npm --skip-git --skip-install --strict --no-observe
npm.cmd pkg set "name=@os-portal/web" --workspace apps/web
npm.cmd pkg set "name=@os-portal/api" --workspace apps/api
npm.cmd install
```

Select the NestJS module/test configuration explicitly when prompted and record it. The recommended baseline is its current supported ESM configuration with Vitest, if the resolved stable version supports it; do not mix generated CommonJS/Jest setup with incompatible ESM/Prisma examples. Decline optional hosted telemetry/service provisioning unless Stephen selects it. Initial `@latest` is only for reviewed scaffolding; commit the resulting exact dependency lockfile.

The Vite scaffold may offer installation/start prompts; skip duplicate workspace installs and let the root installation create the authoritative lockfile. Remove a nested lockfile only as an explicit P00 cleanup step after verifying there is no independent package workflow to preserve.

Implement the reviewed supporting dependencies, scripts, strict types, development API proxy and environment loading as part of P00/P01. Do not blindly execute a long unreviewed dependency list. The current official Clerk React quickstart uses `@clerk/react`; verify the selected generation and backend SDK together.

## 6 Required workspace script contract

These script names are planned. They do not exist until P00 implements and verifies them.

| Root command | Intended behavior |
| --- | --- |
| npm.cmd run dev:web | Start the Vite web workspace |
| npm.cmd run dev:api | Start NestJS in watch mode |
| npm.cmd run typecheck | Check frontend/backend TypeScript without emitting artifacts |
| npm.cmd run lint | Run configured code-quality checks |
| npm.cmd run test | Run meaningful unit and integration checks |
| npm.cmd run test:e2e | Run configured browser journeys |
| npm.cmd run build | Build web and API production artifacts |
| npm.cmd run contracts:generate | Generate frontend types from the reviewed OpenAPI snapshot |
| npm.cmd run db:generate | Generate the Prisma client for the installed major |
| npm.cmd run db:migrate:dev | Create/apply reviewed development migrations only |
| npm.cmd run db:migrate:deploy | Apply reviewed existing migrations to the selected environment |
| npm.cmd run verify | Run the agreed type/lint/test/build gate |

After the first successful installation, clean installs use `npm.cmd ci` from the repository root. P00 must demonstrate that all script names match their actual implementations.

## 7 Configure local environments

Copy `.env.web.example` to `apps/web/.env.local` and `.env.api.example` to the API's reviewed environment-file location. Set values locally; never paste them into a plan, chat log or commit. The API must explicitly load and validate its environment before startup.

The local browser/API ports proposed by the examples are 5173 and 3000. Production origin is the approved portal subdomain after hosting/DNS configuration. The browser uses a relative API prefix with the Vite proxy locally and the reviewed production proxy later.

Only publishable Clerk and VAPID keys go to the browser. Database URLs, Clerk secret/webhook keys, S3 credentials, Cal.com keys and VAPID private keys remain server-only. Payment keys are added only after a provider is selected.

## 8 Account checklist

- Owner-controlled Clerk development application and verified Stephen identity; production configuration later.
- Selected non-production PostgreSQL database; use the installed Prisma major's pool/direct connection guidance.
- Private development S3-compatible bucket, limited credentials and correct CORS rules.
- Cal.com account, event type and connected calendar configured by Stephen.
- Actual project Drive links with correct recipient permissions.
- Browser push VAPID keys and contact subject generated during the approved integration task.
- Hosting provider/plan identification before any production deployment command.
- Payment account only after currency, business country and method are selected.

Do not treat a provider's free tier as a production guarantee. Confirm budget, data region and quotas. No services have been purchased or provisioned in this planning task.

## 9 First end to end development check

Start API and web in separate terminals using the implemented scripts. Confirm a real health request, Clerk sign-in, pending activation behavior, Owner-only bootstrap/MFA and an isolated Client view. Keep sample users/projects unmistakably non-production. Only after this foundation passes should P03 onward connect real domain workflows.

## 10 Commit and resume

Review the diff and ignored paths before committing. Keep the root lockfile, rules, project skills, plans and memory in Git. Never commit uploads, database dumps or secrets. At session end update the current plan, record actual checks and use `/portal-resume` or the plain prompt next time.
