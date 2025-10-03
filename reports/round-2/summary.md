# Round 2 - Remote spec deduplication

## Objectives

- Remove Playwright remote spec duplication reported by jscpd.
- Keep remote smoke assertions intact while consolidating viewport helpers.

## Results

| Command             | Status | Notes                                                |
| ------------------- | ------ | ---------------------------------------------------- |
| `npm run lint`      | ✅     | Remote spec refactor passes lint with shared helper. |
| `npm run typecheck` | ✅     | Updated imports/types compile cleanly.               |
| `npx jscpd`         | ✅     | No clones detected after refactor (0% duplication).  |

## Outstanding

- Dependency audit/cleanup remains pending.
- Coverage instrumentation and e2e test reliability still need attention.
