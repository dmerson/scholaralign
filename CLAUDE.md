# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### .NET backend

```bash
# Run the full app (also starts Angular dev server via SpaProxy)
dotnet run

# Build only (without running)
dotnet build

# Run all backend tests
dotnet test ScholarAlign.Tests/ScholarAlign.Tests.csproj

# Run a single test class
dotnet test ScholarAlign.Tests/ScholarAlign.Tests.csproj --filter "FullyQualifiedName~EligibilityEvaluatorTests"

# Run a single test method
dotnet test ScholarAlign.Tests/ScholarAlign.Tests.csproj --filter "FullyQualifiedName~Decimal_GTE_PassingAnswer"

# Add a new EF Core migration
dotnet ef migrations add <MigrationName> --output-dir Data/Migrations

# Apply migrations to the database
dotnet ef database update
```

### Angular frontend (run from `ClientApp/`)

```bash
# Start dev server standalone (needs backend running separately)
npm start

# Run all Angular tests (Vitest, non-watch)
node_modules/.bin/ng test --watch=false

# Type-check + build (catches TS errors before committing)
node_modules/.bin/ng build --configuration development
```

## Architecture

### Request flow

```
Browser → Angular SPA (port 4200 dev / wwwroot prod)
        → /api/* proxied to .NET (port 5046 dev / same process prod)
        → ASP.NET Core controllers → EF Core → SQL Server (ScholarAlignDb)
```

In development `dotnet run` auto-launches the Angular dev server via `Microsoft.AspNetCore.SpaProxy`. In production `dotnet publish` builds Angular into `wwwroot` so one process serves everything.

### Authentication

- ASP.NET Core Identity with cookie auth. OAuth via Google and/or Microsoft (configured in `appsettings.Development.json`, which is gitignored).
- `AuthController` handles challenge, callback, `/api/auth/info`, and logout.
- Angular `APP_INITIALIZER` calls `/api/auth/info` on boot and stores the result in `AuthService.user` (a signal). The `authGuard` blocks routes when the signal is null.
- OAuth secrets go in `appsettings.Development.json` under `Authentication:Google:ClientId` / `ClientSecret` and `Authentication:Microsoft:ClientId` / `ClientSecret`.

### The eligibility engine

`EngineController` is the core business-logic controller. Key operations:

- **`POST /api/engine/sync`** — called on every dashboard load. Discovers live scholarships accessible to the user (public orgs or orgs the user is a member of), creates `UserScholarship` records for new ones, then immediately runs `EvaluateRequirementsAsync` to set status: `1` = eligible, `0` = unknown, `-1` = ineligible.
- **`GET /api/engine/dashboard/{email}`** — returns three buckets: eligible / unknown / ineligible.
- **`GET /api/engine/next-question/{email}`** — returns the next unanswered eligibility question (lowest `QuestionOrder` among unanswered), used to drive the wizard on the dashboard.
- **`POST /api/engine/save-answer`** — saves a `Question`/`Answer` pair and re-evaluates requirements for all affected scholarships.

Scholarship visibility: a user sees a scholarship if `Organization.IsPublic == true` OR the user has an `OrganizationUser` record for that org (or a `SubOrganizationUser` record for a suborg within it).

### The "Public" organization

`OrganizationId = Guid.Empty` (`00000000-0000-0000-0000-000000000000`) is the seeded Public organization. It is marked `IsPublic = true`, so its scholarships are visible to all users without membership. All Public Admin pages hardcode this constant. Org Admin pages exclude it and require the user to select a non-public org.

### Data model layers

`Scholarship` is always owned via `ScholarshipAbstract` (the "template") → `Organization`. To find an org's scholarships you must join through `ScholarshipAbstracts`. The `Scholarship` rows hold the live configuration (dates, status, amount, application form link).

Two audit base classes:
- `AuditableEntity` — `CreatedBy`, `CreatedOn`, `UpdatedBy`, `LastModified`
- `CreatedAuditEntity` — `CreatedBy`, `CreatedOn` only (used by `OrganizationUser`, `OrganizationRole`, `ScholarshipCommittee`, `SubOrganizationUser`)

### Frontend structure

```
ClientApp/src/app/
├── app.ts / app.html       — root component, navbar, auth-gated menus
├── app.config.ts           — bootstrap: router, HttpClient, APP_INITIALIZER auth load
├── app.routes.ts           — all routes (lazy-loaded), two admin subtrees:
│                              /org-admin/*  and  /public-admin/*
├── core/
│   ├── services/           — one service per API resource
│   ├── models/             — TypeScript interfaces matching API response shapes
│   └── guards/auth.guard.ts
├── features/
│   ├── dashboard/          — wizard (next question → answer loop) + scholarship buckets
│   ├── applications/       — student application detail + answer saving/submitting
│   ├── org-admin/          — award-years, committees, hierarchy, scholarships,
│   │                          users-roles, requirements, award-scholarships, applications
│   └── public-admin/       — questions, award-years, scholarships, organizations,
│                              suborganizations, applications
└── shared/dialogs/         — standalone dialog components (one per entity CRUD operation)
```

Angular uses **standalone components** throughout (no NgModules). State is managed with **Angular Signals** (`signal()`, `computed()`). No NgRx or other state library.

### Backend test project

`ScholarAlign.Tests/` lives inside the main project directory. The main `.csproj` explicitly excludes it with `<Compile Remove="ScholarAlign.Tests\**" />` to prevent double-compilation.

Tests use **EF Core InMemory** provider. `DbHelper.CreateFresh()` creates a unique in-memory DB per test. Test classes:

- `Engine/EligibilityEvaluatorTests.cs` — operator logic, AND/OR requirement groups
- `Engine/EngineControllerTests.cs` — sync dedup, next-question ordering, answer isolation
- `Controllers/ApplicationsControllerTests.cs` — application CRUD, question management
- `Controllers/UserApplicationsControllerTests.cs` — apply flow, save/submit, engine answer pre-fill

All controller tests that call write actions need `ctrl.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }` because the controllers read `User.Identity?.Name`.

### Angular tests

Uses **Vitest** via `@angular/build:unit-test`. Run with `ng test --watch=false` (not `npx vitest run` directly — that skips Angular's test setup and `describe` is undefined).

Test pattern: each spec file has a `setup()` helper that configures `TestBed`, provides mock services with `vi.fn()`, and calls `fixture.detectChanges()`. Use `afterEach(() => TestBed.resetTestingModule())` for isolation. Mock services as `any` to avoid index-signature TS errors.

## Key conventions

- **Org selector pattern**: pages under Org Admin that are org-scoped load `OrganizationService.getAll()`, filter out `PUBLIC_ORG_ID`, and require the user to pick before showing data or enabling the Add button. Public Admin pages hardcode `PUBLIC_ORG_ID` and load on `ngOnInit`.
- **Dialog data**: dialogs receive all needed data (lookup lists, parent IDs) at open time via `MAT_DIALOG_DATA`; they do not fetch their own data.
- **Sequential RxJS saves**: when saving multiple answers before submitting, use `from(items).pipe(concatMap(...), defaultIfEmpty(null), last())` — RxJS 7 `last()` takes no default-value argument.
