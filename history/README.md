# Workflow source baseline

The distribution includes `workflow-source.bundle`, an optional Git snapshot of this workflow's source. It contains no application implementation, secrets or external Git remote.

Normal setup can use the ZIP files and the git init instructions in SETUP-WINDOWS.md. To recover the committed workflow baseline separately, use Git for Windows to clone the bundle into a new empty folder:

```powershell
git clone C:\path\to\history\workflow-source.bundle C:\Projects\portal-workflow-baseline
```

The source commit was made by the workflow packager, not by pretending Stephen had approved application changes. A future application repository should use Stephen's chosen author identity and remote.
