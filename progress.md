Original prompt: 看一下这个 docs 里面的 pdf，里面有项目的需求，按照这个需求完成这个游戏。开始继续开发，不要用 swift，做 web 前端，java 后端。

2026-03-17
- Parsed `docs/pj1.pdf` requirements without Swift by extracting PDF content streams.
- Core rules identified for current implementation:
- Simultaneous turns with `move` and `attack` orders.
- Move orders resolve before attacks.
- Move requires path through same-owner connected territories.
- Attack requires direct adjacency to enemy territory.
- Combat uses iterative d20 rolls; lower roll loses 1 unit, defender wins ties.
- Multiple attackers to one territory resolve in random server-chosen order; winner becomes defender for later attacks.
- End of turn adds 1 unit to each owned territory.
- Player loses at 0 territories; full-map control wins.
- Repo currently has empty `backend` and `frontend` directories, so implementation is from scratch.
- Plan: build Spring Boot in-memory game server, then Vite canvas frontend, then validate with Playwright skill loop.


2026-03-17
- Added initial Spring Boot backend with in-memory map, setup phase, AI opponents, move/attack validation, move-before-attack execution, d20 combat, reinforcements, defeat/win checks, and REST endpoints.
- Added Vite TypeScript frontend with canvas map, setup controls, order queueing, commit flow, fullscreen toggle, render_game_to_text, and advanceTime hook.
- Verified backend compilation with `mvn test`.

2026-03-17
- Installed frontend dependencies and Playwright package.
- Started frontend dev server and backend server for manual/automated verification.
- Playwright browser launch required system Chrome shims and escalated execution in this environment.

2026-03-17
- Added keyboard-driven cursor controls for automated board interaction: arrows move focus, Space selects, Enter queues/commits, A/B switch attack vs move.
- Fixed duplicated Enter queueing by clearing selection after a queued order.

2026-03-17
- Verified setup reveal flow with Playwright screenshot and render_game_to_text alignment.
- Verified one committed move turn: Green moved 1 from Narnia to Oz, turn advanced to 2, and reinforcement log matched on-screen state.
- Verified one committed attack turn: Green attacked Gondor, combat resolved on server, logs and ownership/units updated consistently in screenshot and text state.

2026-03-17
- Expanded backend turn log detail: committed orders, attack departures, per-round combat dice results, post-combat outcomes, per-territory reinforcements, and end-of-turn territory summary.

2026-03-17
- Frontend now renders structured battle reports grouped into Orders, Combat, Reinforcements, and End Of Turn sections for easier reading.

2026-03-17
- Added backend JUnit coverage for detailed turn/combat logs.
- Added frontend Vitest coverage for log section grouping; fixed summary-line classification bug found by the new test.

2026-03-17
- Investigated report that source territory does not decrease after a move.
- Added backend test proving a 1-unit move can appear unchanged in the final map because end-of-turn reinforcement restores the source territory immediately.
- Added frontend `Turn Changes` summary cards to separate movement delta from reinforcement delta, so sources like `Narnia` now show `move -1` and `reinforce +1` instead of only the final map total.
- Verified with `backend: mvn test`, `frontend: npm test`, and `frontend: npm run build`.
