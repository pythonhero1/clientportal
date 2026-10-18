# Codebase analysis prompt

Use after application code exists, not for the empty starting package.

```text
Read AGENTS.md, BUILD-PLAN.md, the current decisions and
docs/analysis/README.md. Inspect actual source without changing it.

First inventory real files, entry points, dependencies, versions
and domain folders. Derive the per-domain analysis filenames from
the source, then show the intended analysis set and coverage scope.

Produce the required 00 through 07 analysis documents, including
one 04-features file per actual domain. Begin each with Snapshot,
Commit, Scope and measured Coverage. Cite actual path:line evidence.
Do not turn an intended design into a claim about existing code.

For each domain, trace the visible action through authorization,
contracts, persistence, provider calls and error handling. Label
fixtures, mocks, unimplemented paths and omitted checks explicitly.
Record gaps and documentation conflicts without silently fixing
source or settling Stephen's open business decisions.

Write the index and coverage table last. Check two code locators
against their files, confirm every domain is covered, and run the
memory integrity checker. Report incomplete coverage honestly.
Do not add a memory convention without a real finding or approval.
```

To resume, read the current inventory and coverage index, list exactly what was not read/written, then continue those items. Do not restart and overwrite completed evidence without a reason.
