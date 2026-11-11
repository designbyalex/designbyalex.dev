# Session names

Alex reads the sidebar to see what is running, so a session title is a status line: **role, state, issue, subject**, readable at a glance.

## Pattern

```
<role> <state> #<N> <subject>
```

- Role and state are one emoji each, in that order.
- One issue number, the one the work serves; none when the work has none (master, sweep). One number, never a list, a range or a local ticket id: those live in the brief.
- Subject names the thing being made, in two to five words, sentence case. The emojis carry the role and the state, so the subject has no role or state words (writer, picks, plan, held).
- Whole title under 45 characters, so it reads in full in the sidebar.

## Legend

| Role | Emoji |
|---|---|
| Master | 👑 |
| Writer | ✏️ |
| Item writer | 📁 |
| Planner | 🧠 |
| Side worker | 👷 |
| Sweeper | 🧹 |
| Picker or grill | 🔮 |

| State | Emoji | Means | Alex's move |
|---|---|---|---|
| Working | 🟢 | building, planning, probing | nothing |
| Waiting on the master | 🟡 | held until `go`, `READY`, `BLOCKED`, `HELD` | nothing |
| Needs Alex | 🔴 | `NEEDS ALEX`, a picker round, a yes to push, merge or deploy | open it; it is also a row in the master's *Blocked on you* |
| Done | ✅ | `DONE`, merged | archive when the master says so |

## Examples

```
👑 🟢 designbyalex.dev master
✏️ 🟢 #110 Lucide icons
🔮 🔴 #108 Hero animatic
👷 🟢 Standing checks
```

## Renaming

Each session keeps its own title current; the master never bulk-renames.

1. **At start:** set the title from the brief: role, 🟢 (🟡 if the brief holds you), PBI numbers, subject.
2. **On each state change,** before sending the hand-back: `READY`, `BLOCKED` or `HELD` → 🟡, `NEEDS ALEX` → 🔴, `DONE` → ✅, and back to 🟢 on `go` or once Alex answers.
3. **When scope changes,** update the numbers and subject in the same call.

The call is `set_session_title` with `session_id: "self"` (load it with ToolSearch `select:mcp__ccd_session_mgmt__set_session_title`). If Alex set the title themselves, their title stands.

The AFK loop itself runs in a terminal tab, which has no title. So every batch also gets a watcher session, started with the loop and named for the batch's PRD, for example `✏️ 🟢 #46 AFK polish batch`. It shows the batch in the sidebar, keeps its state emoji current and hands back for the batch (see `orchestration.md` → Roles). The master also checks the loop with `pgrep -f afk-loop.sh`.
