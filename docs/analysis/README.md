# Codebase analysis specification

This project is greenfield. No application analysis has run. Do not create a fictional codebase map from the intended architecture. Run ANALYSIS-PROMPT.md after application code exists.

## Required analysis set

| File | Purpose |
| --- | --- |
| 00-inventory.md | Actual source files, versions, entry points and feature domains |
| 01-architecture.md | Observed dependencies, process and state ownership |
| 02-contract.md | Actual HTTP, WebSocket, provider and data contracts |
| 03-safety.md | Actual access boundaries and destructive operations |
| 04-features-domain.md | One file per domain derived from real source structure |
| 05-diagrams.md | Relationships backed by inspected source |
| 06-gaps.md | Stubs, fixtures, missing paths and unimplemented behavior |
| 07-doc-reconciliation.md | Differences between current source and product plans |

Every generated analysis file begins with Snapshot, Commit, Scope and Coverage lines. Count the source files read and name exclusions. Cite real path/line evidence. Mark unattempted work NOT YET ATTEMPTED, uncertain mapping UNVERIFIED, and fixtures explicitly. The analysis is a locator, not a replacement for current source.

Write the index and coverage table last. Do not change application code as part of analysis. Do not claim full coverage from a sample or pre-populate passing checks. Later audits use numbers 08 and above rather than renumbering the base set.
