# Pillar Time Implementation

Pillar Time is an Executive Operating System derivative of Pillar Brief. It keeps the existing source, calendar, model, Telegram, and briefing machinery, then adds the Personal Desktop Mode foundation for a canonical executive record and local planning layer. The original Pillar Brief checkout was not modified; this work lives in the sibling `pillar-time` clone.

The broader architecture is captured in [Executive Operating System Architecture](executive-operating-system.md). Current implementation deliberately does not claim Executive Workspace Mode, multi-user collaboration, autonomous external actions, or completed connector-platform breadth.

## Scope

- Product identity: package metadata, Tauri product name, bundle identifier, browser title, lockup text, and backend defaults now use Pillar Time.
- Data migration: Pillar Time uses `pillar-time.sqlite` by default. Before opening a database, the backend creates a one-time pre-migration backup beside the database and can also copy a legacy `pillar-brief.sqlite` into place.
- Time schema: added tables for preferences, tasks, daily commitments, suggestion feedback, reminders, reminder occurrences, reminder delivery attempts, review templates, important dates, and meeting records.
- Today workflow: the app now opens on Today with Highest Leverage Today, Today’s Three, timeline context, next reminders, and quick capture.
- Planning workflow: Planner captures tasks and important dates. The ranking engine uses leverage category, deadline pressure, source, blockers, and explicit feedback.
- Reminders: reminders are off by default unless the global master switch and the individual reminder are enabled. Telegram text delivery is wired; desktop notification delivery records a skipped attempt until the Tauri notification adapter is connected to these local reminders.
- Reviews: seeded morning, midday, end-of-day, weekly, monthly, quarterly, and annual review templates, disabled by default.
- Meetings: meeting records can be captured locally for future planning context.
- Intelligence: the existing rigorous brief pipeline remains available as the Intelligence section and can still generate source-grounded briefs.

## Backend Interfaces

The backend returns a `time` object in `/api/state`:

- `preferences`
- `todayKey`
- `suggestions`
- `commitments`
- `tasks`
- `reminders`
- `reviews`
- `importantDates`
- `meetings`
- `scheduler`

New local endpoints:

- `PATCH /api/time/preferences`
- `POST /api/time/tasks`
- `PATCH /api/time/tasks/:id`
- `POST /api/time/commitments`
- `PATCH /api/time/commitments/:id`
- `POST /api/time/suggestions/:id/feedback`
- `POST /api/time/reminders`
- `PATCH /api/time/reminders/:id`
- `PATCH /api/time/reviews/:id`
- `POST /api/time/important-dates`
- `POST /api/time/meetings`

## Migration Notes

No destructive migration is performed. Pillar Time prefers `PILLAR_TIME_DB_PATH` and `PILLAR_TIME_DATA_DIR`, with legacy `PILLAR_DB_PATH` and `PILLAR_DATA_DIR` still supported for compatibility. The desktop shell sets `PILLAR_TIME_APP_MODE` and `PILLAR_TIME_DATA_DIR`.

The migration creates a marker file named `.pillar-time-migration-backup-created` after the backup succeeds. If backup creation fails, the backend writes `pillar-time-migration-failed.json` and stops before opening SQLite.

## Current Deferrals

- Desktop reminder notifications are represented in the backend but not yet delivered through the Tauri notification plugin.
- Audio reminders are configuration-ready but not synthesized or delivered.
- Meeting records are manual capture only; automatic meeting prep extraction can be added from calendar events later.
- Existing brief-focused onboarding still exists and should be redesigned for a pure Pillar Time first-run flow.
- Existing app icon assets are reused for now; new Pillar Time artwork can replace them without changing the app logic.
- Executive Workspace Mode, role/delegation support, policy engine, typed external action execution, and shared-service audit/event queues are architecture commitments, not yet implemented in this local-first pass.

## Verification

Run:

```sh
npm install
npm test
npm run check
PILLAR_TIME_DATA_DIR=/tmp/pillar-time-dev npm run dev
```

Open `http://127.0.0.1:42817/#/today`.
