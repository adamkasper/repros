# Agent instructions

This repository stores bug reproductions. Each branch owns one reported failure and its controls.

## Repository workflow

Keep `main` limited to this file and a short README without links. Never merge reproduction branches into `main`.

Start a new reproduction from updated `origin/main` on `repro/<library>-<issue-or-slug>`. Revise an existing reproduction on its own branch.

Put the failing fixture in `<library>-<issue-or-slug>/`. A control goes next to it on the same branch: `<library>-<issue-or-slug>-fix/` for a patched copy, `<library>-<issue-or-slug>-<version>/` for the last working release. Run both through the same verification script (`verify.mjs` at the branch root).

Commit only the fixtures and supporting files. Keep installed dependencies, build output, local state and caches out of Git, with ignore rules on each branch. Check the tracked paths before pushing.

## Anonymity

Reproductions are public. Never copy code, names, domains, routes, copy or config from the project where the bug was found. Rebuild the failure from scratch with generic names (`products`, `item`, `report`, `example.com`) and the smallest config that still fails.

## Fixture documentation

Each fixture README states the bug in one paragraph, the environment, how to run `verify.mjs`, the expected and actual output, and why each file is there. Clone instructions select the reproduction branch.
