# Instravel

Turn travel inspiration into collaborative trip plans.

Instravel is a Next.js app foundation for a Reel-based trip planner. The first milestone focuses on the core project setup: app routes, API placeholders, Prisma models, and local database configuration. It intentionally avoids Instagram scraping, credential collection, video downloading, saved-folder import, and private message access.

## Stack

- Next.js app router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Placeholder current-user auth through environment variables

## Getting started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start Postgres:

```bash
docker compose up -d postgres
```

Apply the initial Prisma migration:

```bash
npm run prisma:migrate
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

```bash
DATABASE_URL="postgresql://instravel:instravel@localhost:5432/instravel?schema=public"
CURRENT_USER_EMAIL="demo@instravel.local"
CURRENT_USER_NAME="Demo Traveler"
```

`CURRENT_USER_EMAIL` and `CURRENT_USER_NAME` are temporary placeholders until a real auth provider is added.

## Routes

- `/` homepage placeholder
- `/dashboard` authenticated dashboard placeholder
- `/trips` trip list placeholder
- `/trips/new` create trip form placeholder
- `/trips/[tripId]` trip detail placeholder

## API

- `GET /api/health` returns app and database health
- `GET /api/trips` lists trips for the placeholder current user
- `POST /api/trips` creates a trip and owner membership
- `POST /api/inspiration-items` creates a user-submitted inspiration item for a trip member

Example trip creation:

```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{"name":"Japan 2026","destinationText":"Tokyo, Kyoto"}'
```

Example inspiration item creation:

```bash
curl -X POST http://localhost:3000/api/inspiration-items \
  -H "Content-Type: application/json" \
  -d '{"tripId":"<trip-id>","sourceType":"instagram_reel","sourceUrl":"https://www.instagram.com/reel/example/","userNote":"Looks good for dinner"}'
```

## Database

Initial models:

- `User`
- `Trip`
- `TripMember`
- `InspirationItem`

Future milestones can add candidate places, resolved places, votes, itinerary days, and itinerary stops.
