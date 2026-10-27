# Reproductions

Each `repro/<library>-<issue-or-slug>` branch contains one bug reproduction and its controls.

Pick the branch for the bug and follow the README in its fixture directory. The failing fixture and its controls live together on that branch.

Start new reproduction branches from `main`. Commit the source, required inputs and lockfiles, and leave dependencies and build output out.

`main` holds only this README and the agent instructions. Reproduction branches are never merged into it.
