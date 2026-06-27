# Pillar Time User Manual

Pillar Time is a planning app for people who have too much in their head.

It helps you answer three simple questions:

1. What actually matters today?
2. What do I need to protect time for?
3. What can I safely let the app handle only after I approve it?

Pillar Time is not mainly a news app. It is not just a calendar. It is not just a task list. It is meant to be a calm daily command center that turns your calendar, Linear work, reminders, notes, and personal context into a clear plan.

The goal is to reduce mental clutter. That means Pillar Time should help you stop carrying everything in your head at once.

## The Big Idea

Most planning tools show you more lists.

Pillar Time is supposed to do something better:

- collect the important facts;
- notice what is urgent, blocked, stale, or risky;
- choose a small number of high-leverage priorities;
- propose where work should fit on your calendar;
- ask before making outside changes;
- keep a record of what happened.

Think of it like a very direct executive assistant.

It should not flatter you. It should not tell you every possible thing. It should help you see what matters, what is slipping, and what needs a real decision.

## What Pillar Time Can Use

Pillar Time works best when it has a few kinds of context.

### Your Calendar

Google Calendar tells Pillar Time what time is already spoken for.

Pillar Time should treat calendar events carefully:

- timed events on your main calendars can block time;
- all-day events usually do not block the whole day;
- shared calendars may be useful context, but they are not always your personal commitments;
- declined events should not guide the plan;
- private or busy-only events should stay private.

This matters because a good plan must know the difference between:

- a real meeting you must attend;
- a holiday shown on a shared calendar;
- someone else's all-day event;
- a soft reminder;
- a hard block.

### Linear

Linear tells Pillar Time about project work.

When Linear is connected, Pillar Time can:

- show your assigned issues;
- group work by project and status;
- notice blocked or stale work;
- include Linear tasks in the daily plan;
- propose calendar blocks to make time for important Linear work;
- let you create, update, or comment on Linear issues from inside the app.

Generated Linear changes should not happen by surprise. Pillar Time should ask for approval before it performs agent-suggested writes.

### Trusted Context

Trusted Context is stable information about you and your world.

It can include things like:

- how you prefer to work;
- what matters most right now;
- standing commitments;
- communication style;
- important relationships;
- personal rules;
- facts the app should remember when planning.

This is not meant to be a giant diary. It is meant to be the reliable background knowledge the app needs so it can make better suggestions.

### Identity Statement

Your identity statement tells Pillar Time how to talk to you and what kind of help you want.

For example, you might tell it:

- what you are trying to protect;
- where you tend to fool yourself;
- what kind of feedback helps you;
- what kind of tone you do or do not want;
- what your bigger priorities are.

This helps the daily plan feel like coaching, not a dry report.

### Standing Commitments

Standing commitments are responsibilities that keep mattering over time.

Examples:

- protect deep work each morning;
- stay responsive to a key client;
- check in with a teammate weekly;
- make time for health;
- write every weekday;
- keep family dinner clear.

Pillar Time should use these when it ranks your day.

### Running To-Do List

The running to-do list is the raw capture area.

It can hold messy things like:

- "follow up with Jordan";
- "fix Linear sync";
- "prepare investor notes";
- "book dentist";
- "finish proposal";
- "ask Max about release build."

The point is to get the thought out of your head. Pillar Time can then help sort what matters now, what can wait, and what needs calendar time.

## Main Screens

## Today

Today is the main screen.

Use it when you want to know what to do next.

Today should show:

- the date and basic day status;
- Highest Leverage Today;
- Today's Three;
- proposed calendar blocks;
- today's calendar;
- next reminders;
- context intake;
- a button to generate the day plan;
- a button to view the full brief or plan.

### Generate Day Plan

Press **Generate Day Plan** when you want Pillar Time to build the plan for the day.

The app should:

1. read your available context;
2. check Calendar;
3. refresh Linear if connected;
4. read local tasks, commitments, reminders, meetings, and trusted context;
5. classify calendar events;
6. rank what matters;
7. choose Today's Three;
8. propose calendar blocks;
9. create approval items for actions that need permission;
10. produce a readable daily coaching brief.

If the model connector is missing, Pillar Time should still create a useful basic plan. It should not simply stop.

### Highest Leverage Today

This section shows the work that seems most worth your time.

It should not be a random task list. Each suggestion should explain:

- why it matters;
- what tension it relieves;
- what goal it serves;
- what it displaces;
- the exact next step.

You can accept, reject, or move suggestions out of today.

### Today's Three

Today's Three is the short list of commitments Pillar Time should protect today.

The idea is simple: if everything matters, nothing matters.

Three strong commitments are better than fifteen vague priorities.

Use Today's Three for the work that would make the day successful even if other things get messy.

### Proposed Calendar

After a day plan is generated, Pillar Time can show proposed calendar blocks across the top.

These are suggested time blocks, such as:

- Deep Work;
- Linear Execution;
- Meeting Prep;
- Follow-up;
- Admin;
- Recovery / Buffer.

The app should place these around your real calendar events. It should not treat normal all-day events as blocking the whole day.

### Approve Calendar

If you like the proposed schedule, press **Approve Calendar**.

Pillar Time should then create the approved blocks on Google Calendar, but only if Calendar is connected with write permission.

Important: generation should not write to your calendar. Approval is the line.

If Calendar is connected only for reading, the app should tell you to reconnect Calendar for write access.

### Add Context & Regenerate

Sometimes the app misses something.

Use **Add Context & Regenerate** when you need to say, "Wait, include this."

You can type or paste extra context, such as:

- "Protect a second 30-minute follow-up block after deep work.";
- "This all-day event is not mine.";
- "The client call is more important than it looks.";
- "I am low energy today, so do not overpack the afternoon."

Then Pillar Time should save that context and rebuild the day plan.

This is one of the most important mental-clutter features. You do not need to rebuild the whole plan in your head. You can add the missing fact and ask the app to try again.

## Planner

Planner is where you capture work before it becomes today's work.

Use Planner for:

- tasks;
- important dates;
- backlog items;
- things you do not want to forget.

Tasks added here can later appear in Today suggestions.

Important dates can include:

- birthdays;
- deadlines;
- renewals;
- trips;
- rituals;
- major project dates.

When you archive a task, it leaves the active planning backlog and should stop showing up as a Today candidate.

## Reminders

Reminders are for nudges.

They are off by default so Pillar Time does not become noisy.

There is usually a master switch plus individual reminder switches. A reminder should only run when the right switches are on.

Reminder channels may include:

- desktop text;
- desktop audio;
- Telegram text;
- Telegram audio.

Use reminders for things that need a nudge, not for everything in your life.

Good reminders are specific:

- "Start end-of-day review at 4:45 PM";
- "Check whether the client follow-up was sent";
- "Look at tomorrow's first meeting before stopping work."

Bad reminders are vague:

- "Be productive";
- "Do stuff";
- "Remember everything."

## Reviews

Reviews are planning rituals.

Pillar Time can include templates for:

- morning review;
- midday check;
- end-of-day wrap;
- weekly kickoff;
- monthly review;
- quarterly review;
- annual planning.

Reviews help reduce mental clutter by giving recurring thoughts a home.

Instead of asking "Am I forgetting something?" all day, you can trust that the right review will catch it.

## Intelligence

Intelligence is the optional news and source-grounded brief area.

Use Intelligence when you want a report based on sources like RSS, web pages, Reddit, X, YouTube, podcasts, or documents.

This is separate from the normal day plan.

The day plan should focus on your time, commitments, calendar, Linear work, reminders, and trusted context. Intelligence should not quietly take over the Today screen.

## Meetings

Meetings is where you capture meeting context.

Use it for:

- meeting intent;
- notes;
- decisions;
- follow-ups;
- commitments;
- things to remember for later planning.

The point is not to make perfect meeting notes. The point is to keep useful meeting facts from disappearing.

After meetings, Pillar Time should help turn notes into commitments, follow-ups, and future prep.

## Linear

The Linear screen lets you work with Linear issues from inside Pillar Time.

When connected, you can:

- choose a team;
- filter by assignee, state, and project;
- see issues grouped by project;
- create issues;
- update issue fields;
- add comments.

Pillar Time should use Linear data when it builds the day plan. For example, a blocked issue, a due-today issue, or a stale high-priority issue may become a high-leverage suggestion.

## Trusted Context

Trusted Context is where you manage facts the app should rely on.

Use it for information that should guide planning, writing, and suggestions.

Trusted Context should be:

- accurate;
- useful;
- source-backed when possible;
- not too long;
- not full of random memories.

You can think of it as the app's "what should I know about you?" layer.

## Settings

Settings is where you connect services and control technical options.

Common settings include:

- model provider;
- Google Calendar;
- Linear;
- Telegram;
- Reddit;
- X;
- ElevenLabs audio;
- local speech-to-text setup;
- app updates;
- health checks.

If something feels broken, Settings is usually the place to check first.

## Connectors

Connectors let Pillar Time talk to outside services.

## Google Calendar

Google Calendar lets Pillar Time read your schedule.

With write access, it can also create approved calendar blocks.

Pillar Time should never change your calendar just because it generated a plan. Calendar writes should require approval.

If calendar approval fails, check whether Calendar needs to be reconnected with write permission.

## Linear

Linear lets Pillar Time read and update project work.

You need a Linear personal API key.

The key is saved locally. Pillar Time should not show the saved key back to the screen.

## Telegram

Telegram can deliver plans or briefs outside the app.

Telegram can also support commands such as approving a pending calendar proposal, when that feature is configured.

If Telegram delivery says it is unclear whether the message arrived, check Telegram before sending again. This helps avoid duplicate messages.

## Model Provider

A model provider lets Pillar Time write better summaries, coaching language, and judgment calls.

Without a model provider, Pillar Time should still work in a simpler deterministic mode.

With a model provider, it can be more helpful, but it still should not take actions without approval.

## ElevenLabs Audio

ElevenLabs can read briefs aloud.

This is optional. You do not need it for the main planning features.

## Speech To Text

Speech to text can help you add context by voice.

In desktop builds, the app can use a local Whisper model. If the model is not installed, the app may ask whether you want to download it.

Voice input should be a convenience, not a requirement.

## Approvals

Approvals are a safety layer.

Pillar Time may suggest actions, but important outside changes should wait for you.

Examples of actions that should need approval:

- create Google Calendar blocks;
- update Google Calendar blocks;
- create Linear issues;
- update Linear issues;
- add Linear comments;
- send external messages in future versions.

An approval should show what will happen before it happens.

If an approval is old or unclear, do not approve it. Regenerate the plan or make the change manually.

## How Pillar Time Reduces Mental Clutter

Pillar Time should reduce mental clutter in seven ways.

### 1. It gives your thoughts a place to land

Instead of holding tasks in your head, put them into Planner, Today context, Trusted Context, or Meetings.

The rule is: if you are afraid you will forget it, capture it.

### 2. It chooses a small number of priorities

Today's Three keeps the day from becoming a giant pile.

The app should help you decide what matters most today, not just remind you of everything.

### 3. It separates facts from suggestions

A calendar event is a fact.

"You should prep for it" is a suggestion.

"Create a calendar block" is an action.

Pillar Time should keep those separate so you can trust what you are seeing.

### 4. It protects time

Important work needs space.

Pillar Time should propose calendar blocks for work that matters, especially work that is easy to avoid because it is hard, quiet, or not urgent-looking.

### 5. It catches bad assumptions

A good assistant should notice things like:

- you are treating someone else's calendar event as yours;
- you have too many commitments for the day;
- you are avoiding the hard task;
- you are letting urgent noise beat important work;
- a blocked issue needs a human next step.

### 6. It keeps actions approval-gated

You should be able to trust the app because it does not silently act in public systems.

It can propose. You approve.

### 7. It creates a daily loop

The daily loop is:

1. capture what is on your mind;
2. generate the day plan;
3. review the proposed priorities;
4. approve calendar blocks if they are right;
5. work the plan;
6. add missing context when needed;
7. review what changed.

## A Simple Daily Routine

Here is a good way to use Pillar Time each morning.

1. Open Today.
2. Add anything important that is in your head.
3. Check that Calendar and Linear are connected if you need them.
4. Press **Generate Day Plan**.
5. Read Today's Three.
6. Look at the proposed calendar blocks.
7. Add missing context if the plan is wrong.
8. Regenerate if needed.
9. Approve the calendar if it looks right.
10. Start with the first high-leverage block.

At midday:

1. Open Today again.
2. Add any new context.
3. Regenerate if the day has changed.
4. Protect the next best block.

At the end of the day:

1. Mark completed commitments done.
2. Capture loose ends.
3. Add follow-ups from meetings.
4. Let tomorrow start with less clutter.

## Good Context To Add

Good context is clear and useful.

Examples:

- "The all-day school calendar event is not mine."
- "The investor update matters more than the inbox today."
- "I need a 30-minute follow-up block after the deep work block."
- "Do not schedule anything after 5 PM unless it is already on my calendar."
- "The Linear issue about calendar writes is blocked until Google scope is fixed."
- "I am tired today, so protect one hard thing and leave more buffer."

## What Not To Use Pillar Time For

Do not use Pillar Time as:

- a place to dump every random thought forever;
- a replacement for your own judgment;
- a tool that should act without review;
- a medical, legal, financial, or emergency decision-maker;
- a reason to avoid talking to real people.

Pillar Time should make your judgment sharper. It should not replace it.

## Troubleshooting

### The day plan looks like a news report

Use Today and **Generate Day Plan**, not the Intelligence workflow.

Today should use calendar, Linear, reminders, meetings, tasks, and context. Intelligence is separate.

### The app ignores Linear work

Check Settings and make sure Linear is connected.

Then open the Linear screen and refresh issues.

### Calendar blocks do not get created

Calendar may be connected for reading only.

Open Settings and reconnect Google Calendar with write permission.

### The app thinks an all-day event blocks my day

Add context and regenerate.

Example: "This all-day event is just shared calendar context. It is not my commitment and should not block scheduling."

### Telegram says delivery is unclear

Check Telegram before sending again.

Sometimes the message sends but the app does not get a clear acknowledgement quickly.

### The model connector is not ready

The app should still make a basic deterministic plan.

For better coaching language and judgment, set up a model provider in Settings.

### I do not want all connectors on

Leave optional connectors disabled.

Pillar Time should still work with local context. Calendar and Linear make it stronger, but they are not required for every use.

## What "Working Well" Looks Like

Pillar Time is working well when:

- you know the few things that matter today;
- your calendar has protected blocks for real work;
- all-day shared events are not treated as hard blockers;
- Linear work appears when it matters;
- reminders are helpful, not noisy;
- the app asks before writing to outside systems;
- missing context is easy to add;
- you feel less need to hold the whole day in your head.

The best version of Pillar Time should feel like this:

"I can see the day clearly. I know what matters. I know what can wait. I know what needs approval. I can stop carrying the whole plan in my head."
