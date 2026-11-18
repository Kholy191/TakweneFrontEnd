# Takwene Front-End

Angular 21 + PrimeNG 21 (MIT) + Tailwind CSS 4 client for the Takwene Track Management API.

## Run with Docker (whole stack)

Clone this repo next to the backend repo (`../TakweneFrontEnd` from the backend folder), then in the backend folder:

```bash
docker compose up --build
```

Open http://localhost:8080. nginx serves the app and proxies `/api` to the API container, so there is
no CORS or certificate setup. Swagger: http://localhost:5243 · Seq logs: http://localhost:8081.

## Run for development

1. Start the API (`https://localhost:7000`). Trust the .NET dev certificate once: `dotnet dev-certs https --trust`.
2. Install and start:

   ```bash
   npm ci
   npm start
   ```

3. Open http://localhost:4200 and use a demo button on the login card.

Admins also get an **Artists** page: creating an artist provisions their login and shows the
email and one-time password (with copy buttons), so you can sign out and sign straight in as that artist.

| Account | Email | Password |
| --- | --- | --- |
| Admin | admin@takwene.com | Admin@12345 |
| Artist | amr@takwene.com / cairokee@takwene.com / wegz@takwene.com | Artist@12345 |

`npm start` uses `src/environments/environment.development.ts` (`https://localhost:7000`; the API allows
`http://localhost:4200` via `Cors:AllowedOrigins`). Production builds use `environment.ts`, where the API is on
the same origin behind nginx.

## API clients (NSwag)

`src/app/core/api/api-clients.ts` is generated from `openapi.json`, one client per controller
(`AuthClient`, `ArtistsClient`, `TracksClient`, `DspsClient`). After an API change:

1. Save `https://localhost:7000/openapi/v1.json` over `openapi.json`.
2. Run `npm run generate:api` (needs the .NET 10 runtime).

## Structure

```text
src/app/
├── core/
│   ├── api/            NSwag-generated clients (do not edit by hand)
│   ├── artists/        ArtistDirectory: shared artist list for admin dropdowns
│   ├── auth/           AuthService: session in signals + localStorage
│   ├── interceptors/   Bearer token + refresh-on-401, ProblemDetails error toasts
│   ├── guards/         authGuard, guestGuard, adminGuard
│   └── layout/shell/   Top bar + routed content
├── features/
│   ├── login/          Login form with demo-account buttons
│   ├── artists/        artist-list, create-artist-dialog (admin only)
│   └── tracks/         track-list, track-detail, create-track-dialog, distribute-dialog
└── shared/             Small pure helpers (status colours, ISRC, dates)
```
