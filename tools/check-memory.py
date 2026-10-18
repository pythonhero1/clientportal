#!/usr/bin/env python3
"""Integrity check for the agent memory kit.

Run from the workspace root:

    python3 tools/check-memory.py

Checks the four things that have actually gone wrong in practice, rather than
style: encoding corruption, files past the 200-line cap, duplicate or missing
entry ids across a rollover family, and rule files citing ids that do not
exist.

Exit code 0 = pass, 1 = at least one FAIL. WARN does not fail the run.
Standard library only. Reads files; writes nothing.

Accepts either a plain hyphen or a middle dot as the heading separator, so it
also runs against older projects that used the typographic version.
"""

import os
import re
import sys

CAP = 200
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
FAMILIES = ("corrections", "decisions", "patterns")
PREFIX = {"corrections": "C", "decisions": "D", "patterns": "P"}
SEAL = "<!-- SEALED. Continues in memory/"
MOJIBAKE = ("\u00c2\u00b7", "\u00e2\u0080", "\u00c3\u00a9", "\u00c2\u00a0")
CITERS = ("AGENTS.md", ".agents/rules", "plans", "handoff", "docs/analysis")
MARKERS = ("FILL:", "PROJECT_NAME", "OWNER")
SKIP_MARKER_FILES = ("SETUP.md", "BOOTSTRAP-PROMPT.md", "ANALYSIS-PROMPT.md")

fails = []
warns = []
passes = []


def ok(msg):
    passes.append(msg)
    print("[PASS] " + msg)


def warn(msg):
    warns.append(msg)
    print("[WARN] " + msg)


def fail(msg):
    fails.append(msg)
    print("[FAIL] " + msg)


def read_bytes(path):
    with open(path, "rb") as handle:
        return handle.read()


def rel(path):
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def shards(family):
    """Family files in shard order: name.md, name-2.md, name-3.md ..."""
    found = []
    memdir = os.path.join(ROOT, "memory")
    base = os.path.join(memdir, family + ".md")
    if os.path.exists(base):
        found.append((1, base))
    pattern = re.compile(r"^" + re.escape(family) + r"-(\d+)\.md$")
    if os.path.isdir(memdir):
        for name in sorted(os.listdir(memdir)):
            match = pattern.match(name)
            if match:
                found.append((int(match.group(1)), os.path.join(memdir, name)))
    found.sort()
    return [path for _, path in found]


def check_encoding(path, raw):
    name = rel(path)
    if b"\x00" in raw:
        fail(name + ": contains " + str(raw.count(b"\x00")) + " NUL bytes. That is"
             " a UTF-16 write, almost certainly a PowerShell > or Out-File"
             " redirect. Rewrite the file with a file-write tool.")
        return None
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        fail(name + ": not valid UTF-8 (" + str(exc) + ")")
        return None
    if "\ufffd" in text:
        fail(name + ": contains " + str(text.count("\ufffd")) + " U+FFFD"
             " replacement characters. A character was lost before this file was"
             " saved; the original is not recoverable from the file itself.")
    for seq in MOJIBAKE:
        if seq in text:
            fail(name + ": double-encoded sequence " + repr(seq) + " x"
                 + str(text.count(seq)) + ". Read as latin-1, written as UTF-8.")
    crlf = raw.count(b"\r\n")
    if crlf and raw.count(b"\n") != crlf:
        warn(name + ": mixed line endings (" + str(crlf) + " CRLF of "
             + str(raw.count(b"\n")) + " lines). Harmless to read, noisy in"
             " diffs, and it hides real changes in review.")
    return text


def check_cap(path, text):
    name = rel(path)
    count = len(text.splitlines())
    if count > CAP:
        fail(name + ": " + str(count) + " lines, " + str(count - CAP) + " over the"
             " " + str(CAP) + "-line cap. Merge duplicates, archive SUPERSEDED"
             " entries older than 30 days, then roll over into a numbered shard.")
    elif count > int(CAP * 0.9):
        warn(name + ": " + str(count) + " lines, " + str(CAP - count) + " from the"
             " cap. Plan the rollover now rather than mid-append.")
    return count


def entry_ids(text, prefix):
    """Yield (lineno, id) for headings like '### C-12 - title'."""
    pattern = re.compile(r"^###\s+(" + prefix + r"-\d+)(?=\s|$)")
    for lineno, line in enumerate(text.splitlines(), 1):
        match = pattern.match(line)
        if match:
            yield lineno, match.group(1)


def check_family(family):
    files = shards(family)
    if not files:
        warn("memory/" + family + ".md: missing. The kit expects it to exist,"
             " even empty.")
        return set()

    ids = {}
    total = 0
    fenced = 0
    for index, path in enumerate(files):
        name = rel(path)
        text = check_encoding(path, read_bytes(path))
        if text is None:
            continue
        total += check_cap(path, text)

        sealed = SEAL in text
        is_last = index == len(files) - 1
        if sealed and is_last:
            fail(name + ": sealed, but it is the highest-numbered file in the"
                 " family. The continuation it names does not exist, so an"
                 " append has nowhere to go.")
        if not sealed and not is_last:
            fail(name + ": a later shard exists but this file carries no SEALED"
                 " marker. The active shard is ambiguous and entries will land in"
                 " both.")

        in_fence = False
        for lineno, line in enumerate(text.splitlines(), 1):
            if line.startswith("```"):
                in_fence = not in_fence
                continue
            match = re.match(r"^###\s+(" + PREFIX[family] + r"-\d+)(?=\s|$)", line)
            if not match:
                continue
            entry = match.group(1)
            if in_fence:
                fenced += 1
                continue
            if entry in ids:
                fail("duplicate id " + entry + ": " + ids[entry] + " and " + name
                     + ":" + str(lineno) + ". Ids are unique across the whole"
                     " family, not per file.")
            else:
                ids[entry] = name + ":" + str(lineno)

    if fenced:
        warn("memory/" + family + " family: " + str(fenced) + " id heading(s) sit"
             " inside a code fence and are templates, not entries. Nothing may"
             " cite them.")

    if ids:
        nums = sorted(int(k.split("-")[1]) for k in ids)
        label = ("memory/" + family + " family: " + str(len(ids)) + " entries, "
                 + str(total) + " lines across " + str(len(files)) + " file(s)")
        missing = [n for n in range(1, nums[-1] + 1) if n not in set(nums)]
        if missing:
            warn(label + ". Gaps: " + ", ".join(
                PREFIX[family] + "-" + str(n) for n in missing)
                + ". Expected if those were archived; investigate if not.")
        else:
            ok(label + ", ids " + PREFIX[family] + "-1.." + PREFIX[family] + "-"
               + str(nums[-1]) + ", no duplicates")
    else:
        ok("memory/" + family + " family: empty, " + str(total)
           + " lines. Expected in a new workspace.")
    return set(ids)


def md_files(target):
    base = os.path.join(ROOT, target)
    if os.path.isfile(base):
        return [base]
    out = []
    if os.path.isdir(base):
        for dirpath, _, names in os.walk(base):
            out += [os.path.join(dirpath, n) for n in sorted(names)
                    if n.endswith(".md")]
    return out


def check_citations(known):
    cited = {}
    for target in CITERS:
        for path in md_files(target):
            name = rel(path)
            in_fence = False
            text = read_bytes(path).decode("utf-8", "replace")
            for lineno, line in enumerate(text.splitlines(), 1):
                if line.startswith("```"):
                    in_fence = not in_fence
                    continue
                if in_fence:
                    continue
                if "-<n>" in line or "-n " in line or "C-n" in line:
                    continue
                for entry in re.findall(r"(?<![\w-])([CDP]-\d+)(?![\w-])", line):
                    cited.setdefault(entry, []).append(name + ":" + str(lineno))

    if not cited:
        ok("no entry ids cited outside memory/ - nothing can dangle")
        return
    dangling = dict((k, v) for k, v in cited.items() if k not in known)
    if dangling:
        for entry in sorted(dangling):
            fail("dangling citation " + entry + " at " + ", ".join(dangling[entry])
                 + " - no such entry in memory/. The rules require quoting an id"
                 " before citing it, so this one can never be satisfied.")
    else:
        ok(str(len(cited)) + " cited id(s) all resolve to a real entry")


def check_markers():
    hits = []
    for dirpath, dirnames, names in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames
                       if d not in (".git", "node_modules", "__pycache__")]
        for name in sorted(names):
            if not (name.endswith(".md") or name == ".gitignore"):
                continue
            path = os.path.join(dirpath, name)
            if rel(path) in SKIP_MARKER_FILES:
                continue
            text = read_bytes(path).decode("utf-8", "replace")
            for lineno, line in enumerate(text.splitlines(), 1):
                for marker in MARKERS:
                    if marker in line:
                        hits.append(rel(path) + ":" + str(lineno) + "  " + marker)
    if hits:
        warn(str(len(hits)) + " unfilled placeholder(s) remain. An always-on rule"
             " with a placeholder costs context and says nothing."
             " First 10:")
        for hit in hits[:10]:
            print("         " + hit)
    else:
        ok("no FILL: / PROJECT_NAME / OWNER placeholders left")


def check_referenced_paths():
    expected = (
        "AGENTS.md",
        ".agents/rules/project-memory.md",
        ".agents/rules/plan-before-build.md",
        "memory/corrections.md",
        "memory/decisions.md",
        "memory/patterns.md",
        "memory/archive.md",
        "plans/README.md",
        "handoff/README.md",
        "docs/analysis/README.md",
    )
    missing = [p for p in expected if not os.path.exists(os.path.join(ROOT, p))]
    if missing:
        for path in missing:
            warn(path + ": referenced by the rules but not present.")
    else:
        ok("all " + str(len(expected)) + " paths referenced by the rules exist")


def check_analysis():
    """The analysis set is adaptive: 00-07 plus one 04-features-* per domain."""
    base = os.path.join(ROOT, "docs", "analysis")
    if not os.path.isdir(base):
        return
    names = sorted(n for n in os.listdir(base) if n.endswith(".md"))
    if names == ["README.md"]:
        ok("docs/analysis/: spec only, no pass has run yet."
           " Run ANALYSIS-PROMPT.md once there is code.")
        return
    required = ("00-inventory", "01-architecture", "02-contract", "03-safety",
                "05-diagrams", "06-gaps", "07-doc-reconciliation")
    missing = [r for r in required
               if not any(n.startswith(r) for n in names)]
    features = [n for n in names if n.startswith("04-features")]
    if missing:
        warn("docs/analysis/: missing " + ", ".join(missing)
             + ". The pass did not finish - use the resume block in"
             " ANALYSIS-PROMPT.md rather than restarting it.")
    if not features:
        warn("docs/analysis/: no 04-features-*.md file. The feature domains were"
             " never sharded, so Phase 0 of the analysis prompt did not run.")
    noheader = []
    for name in names:
        text = read_bytes(os.path.join(base, name)).decode("utf-8", "replace")
        head = text[:600]
        if "Coverage:" not in head or "Snapshot:" not in head:
            if name != "README.md":
                noheader.append(name)
    if noheader:
        warn("docs/analysis/: no Snapshot/Coverage header in "
             + ", ".join(noheader) + ". A file without that header was abandoned"
             " mid-write and its coverage is unknown - rewrite it.")
    if not missing and features and not noheader:
        ok("docs/analysis/: " + str(len(names)) + " files, " + str(len(features))
           + " feature domain(s), all headers present")


def main():
    print("Memory integrity check")
    print("Root: " + ROOT)
    print("-" * 70)
    known = set()
    for family in FAMILIES:
        known |= check_family(family)

    archive = os.path.join(ROOT, "memory", "archive.md")
    if os.path.exists(archive):
        text = check_encoding(archive, read_bytes(archive))
        if text is not None:
            for _, entry in entry_ids(text, "[CDP]"):
                known.add(entry)
    else:
        warn("memory/archive.md: missing. Step 2 of the size rule has nowhere to"
             " move SUPERSEDED entries.")

    check_citations(known)
    check_referenced_paths()
    check_analysis()
    check_markers()

    print("-" * 70)
    print(str(len(passes)) + " pass, " + str(len(warns)) + " warn, "
          + str(len(fails)) + " fail")
    if fails:
        print("RESULT: FAIL")
        return 1
    print("RESULT: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
