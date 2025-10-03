# Round 1 - Toolchain Stabilization

## Objectives

- Resolve TypeScript `NodeNext` import errors affecting `npm run typecheck`.
- Provide root-level TypeScript config to unblock `ts-prune`.
- Scope jscpd analysis to project sources to prevent node_modules flood.
- Confirm lint remains clean after import adjustments.

## Results

| Command             | Status          | Notes                                                                                                                                    |
| ------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck` | ✅              | TypeScript now clean after adding JSON import attributes and `.js` extensions for Playwright helpers.                                    |
| `npm run lint`      | ✅              | No lint violations introduced.                                                                                                           |
| `npx ts-prune`      | ✅              | Executes without configuration errors (no unused exports reported).                                                                      |
| `npx jscpd`         | ⚠️ Issues found | Tool runs successfully; reports 1 internal duplicate (Playwright remote spec) totaling 1.14% of lines—needs remediation in later rounds. |

## Outstanding

- Address the Playwright spec duplication flagged by jscpd.
- Continue fixing other baseline gaps (coverage instrumentation, e2e setup, depcheck/knip findings, etc.).
