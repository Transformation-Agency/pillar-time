# Pillar Time

Pillar Time is an Executive Operating System derived from Pillar Brief. It combines a canonical executive record, connected systems, and policy-controlled automation. The current build implements the Personal Desktop Mode foundation: daily planning, reminders, review templates, meeting notes, important dates, Google Calendar context, Telegram delivery, and the existing source-grounded intelligence brief pipeline.

The app is designed to run on your machine with a local SQLite database. Source credentials, tasks, reminders, generated briefs, and planning records stay local unless you explicitly connect external services such as Google Calendar, Telegram, OpenAI-compatible model providers, X, Reddit, Linear, or podcast transcription services.

## What Changed From Pillar Brief

- The app now opens to Today instead of a source setup landing page.
- Today includes Highest Leverage Today, Today’s Three, quick capture, timeline context, and next reminders.
- Planner captures tasks and important dates.
- Reminders have explicit global and per-reminder switches and are disabled by default.
- Review templates are seeded for daily, weekly, monthly, quarterly, and annual planning.
- Meeting records can be captured locally for future planning context.
- The existing intelligence brief workflow remains under Intelligence.

See [docs/executive-operating-system.md](docs/executive-operating-system.md) for the product architecture and [docs/pillar-time-implementation.md](docs/pillar-time-implementation.md) for schema, migration, endpoint, and verification notes.

## Development

```sh
npm install
npm test
npm run check
npm run dev
```

Open `http://127.0.0.1:42817/#/today`.

For an isolated local database:

```sh
PILLAR_TIME_DATA_DIR=/tmp/pillar-time-dev npm run dev
```

## Linear Connector

Pillar Time includes a personal Linear connector for the Transformation Agency workspace. It reads teams, projects, workflow states, and issues from Linear and can create issues, update issue fields such as state or assignee, and add comments.

Setup:

1. Create a personal API key in Linear under Settings > Security & access > Personal API keys.
2. Add `LINEAR_API_KEY=...` to your local `.env` or launch environment.
3. Restart Pillar Time so the backend sees the key.
4. Open Settings > Linear > Test.
5. Open the Linear page to review grouped issues, create work, move workflow states, and add comments.

The personal API key is passed directly in the Linear `Authorization` header, matching Linear's personal API key flow. Pillar Time keeps this secret env-only: it is not stored in SQLite, not shown in Settings, and not committed. Multi-user OAuth can be added later if this moves beyond Personal Desktop Mode.

For a live smoke test, set both `RUN_LINEAR_SMOKE=1` and `LINEAR_API_KEY`, then run:

```sh
npm test
```

## Desktop Build

```sh
npm run desktop:prepare
npm run desktop:build
```

The Tauri product name is `Pillar Time`, bundle identifier is `com.pillartime.desktop`, and the Node sidecar is packaged as `pillar-time-backend`.

## Privacy

Pillar Time stores local state in SQLite. The desktop app uses `PILLAR_TIME_DATA_DIR` in the app data directory. The backend still accepts legacy `PILLAR_DATA_DIR` and `PILLAR_DB_PATH` variables for migration compatibility.

Before using an existing Pillar Brief database, Pillar Time attempts to create a one-time pre-migration backup next to the database.
