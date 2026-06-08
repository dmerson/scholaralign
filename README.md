# ScholarAlign

A full-stack scholarship management platform built with .NET 9 and Angular 21. Students can browse and apply for scholarships; administrators manage scholarships, organizations, and applications. Authentication is handled via Google and Microsoft OAuth.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Browser                               │
│                                                         │
│   Angular 21 SPA (http://localhost:4200 in dev)         │
│   ├── Proxies /api, /signin-* → .NET HTTP port 5046     │
└─────────────────────────────────────────────────────────┘
              │ HTTP (dev proxy) / direct (prod)
┌─────────────────────────────────────────────────────────┐
│                .NET 9 Web API                           │
│   https://localhost:7255  /  http://localhost:5046      │
│                                                         │
│   ├── ASP.NET Core Identity (cookie auth)               │
│   ├── Google / Microsoft OAuth middleware               │
│   ├── Entity Framework Core → SQL Server                │
│   └── SpaProxy (dev) / wwwroot (prod)                   │
└─────────────────────────────────────────────────────────┘
              │ EF Core
┌─────────────┐
│  SQL Server │  ScholarAlignDb
└─────────────┘
```

### Single-server deployment
In production, `dotnet publish` runs `ng build` and copies the Angular output into `wwwroot`. The .NET process serves both the API and the static Angular files, so only one process and one port are needed.

In development, `dotnet run` launches the Angular dev server automatically via `Microsoft.AspNetCore.SpaProxy` and proxies non-API requests to it.

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | .NET 9 |
| API | ASP.NET Core Web API (controller-based) |
| Auth | ASP.NET Core Identity + Google OAuth + Microsoft OAuth |
| ORM | Entity Framework Core 9 (code-first, SQL Server) |
| Frontend | Angular 21 (standalone components, zoneless, Vite) |
| UI | Angular Material 21 |
| State | Angular Signals |

---

## Project structure

```
ScholarAlign/
├── Controllers/
│   ├── AuthController.cs          # OAuth challenge/callback, /api/auth/info, logout
│   ├── ScholarshipsController.cs
│   ├── OrganizationsController.cs
│   └── ApplicationsController.cs
├── Data/
│   ├── ApplicationDbContext.cs    # IdentityDbContext with domain tables
│   └── Migrations/
├── Models/
│   ├── ApplicationUser.cs         # Extends IdentityUser (FirstName, LastName)
│   ├── Scholarship.cs
│   ├── Organization.cs
│   └── ScholarshipApplication.cs
├── Program.cs                     # DI, middleware pipeline, EF, Identity, OAuth
├── appsettings.json               # Non-secret config (connection string template, log levels)
├── appsettings.Development.json   # ⚠ GITIGNORED — put your OAuth secrets here
└── ClientApp/                     # Angular workspace
    └── src/app/
        ├── app.ts                 # Root component, navbar, auth state
        ├── app.config.ts          # Bootstrap: router, HttpClient, APP_INITIALIZER
        ├── app.routes.ts          # Lazy-loaded routes
        ├── core/
        │   ├── services/
        │   │   ├── auth.service.ts          # Signal-based auth state, loadCurrentUser()
        │   │   ├── scholarship.service.ts
        │   │   ├── organization.service.ts
        │   │   └── application.service.ts
        │   ├── models/            # TypeScript interfaces
        │   └── guards/            # authGuard, adminGuard
        └── features/
            ├── home/
            ├── login/
            ├── scholarships/      # scholarship-list, scholarship-detail
            ├── apply/
            ├── my-applications/
            └── admin/             # dashboard, manage-scholarships, manage-applications, manage-organizations
```

---

## Data model

```
ApplicationUser  (extends IdentityUser)
  ├── FirstName, LastName
  └── ScholarshipApplications[]

Organization
  └── Scholarships[]

Scholarship
  ├── Organization (FK)
  ├── Amount, Deadline, EligibilityCriteria
  └── Applications[]

ScholarshipApplication
  ├── Scholarship (FK)
  ├── User (FK)
  └── Status, EssayResponse, SubmittedAt
```

---

## OAuth login flow

```
1. Angular → GET /api/auth/challenge/Google?returnUrl=/
2. .NET builds redirect_uri, redirects browser to Google
3. Google authenticates user → redirects to /signin-google?code=...
4. .NET middleware processes code, calls SignInAsync (external scheme)
5. Browser → GET /api/auth/callback?returnUrl=/
6. AuthController: GetExternalLoginInfoAsync → find or create ApplicationUser
7. SignInAsync (application scheme) → sets Identity cookie
8. Redirect to /?auth=1
9. Angular APP_INITIALIZER calls GET /api/auth/info → returns user JSON
10. AuthService sets currentUser signal → navbar shows email
```

---

## Getting started

### Prerequisites
- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- SQL Server (local or remote)

### 1. Clone and configure secrets

Create `appsettings.Development.json` (this file is gitignored):

```json
{
  "Authentication": {
    "Google": {
      "ClientId": "YOUR_GOOGLE_CLIENT_ID",
      "ClientSecret": "YOUR_GOOGLE_CLIENT_SECRET"
    }
  }
}
```

To get Google credentials, visit [console.cloud.google.com](https://console.cloud.google.com), create an OAuth 2.0 client, and add these authorized redirect URIs:

- `https://localhost:7255/signin-google` (for running via .NET directly)
- `http://localhost:4200/signin-google` (for running via Angular dev server)

### 2. Update the connection string

Edit the `DefaultConnection` in `appsettings.json` to point to your SQL Server instance.

### 3. Create the database

```bash
dotnet ef database update
```

### 4. Run

```bash
dotnet run
```

.NET starts on `https://localhost:7255` and automatically launches the Angular dev server at `http://localhost:4200`. Open either URL in a browser.

### Production build

```bash
dotnet publish -c Release
```

This runs `ng build` and bundles the Angular output into `wwwroot`, producing a single deployable .NET application.

---

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/info` | — | Returns current user or `{isAuthenticated: false}` |
| GET | `/api/auth/challenge/{provider}` | — | Initiates OAuth (provider: `Google`, `MicrosoftAccount`) |
| GET | `/api/auth/callback` | — | OAuth callback handler |
| POST | `/api/auth/logout` | Required | Signs out |
| GET | `/api/scholarships` | — | List all scholarships |
| GET | `/api/scholarships/{id}` | — | Scholarship detail |
| POST | `/api/scholarships` | Admin | Create scholarship |
| PUT | `/api/scholarships/{id}` | Admin | Update scholarship |
| DELETE | `/api/scholarships/{id}` | Admin | Delete scholarship |
| GET | `/api/organizations` | — | List organizations |
| GET | `/api/applications` | Required | User's applications |
| POST | `/api/applications` | Required | Submit application |
