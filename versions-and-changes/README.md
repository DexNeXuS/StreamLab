# Versions and changes

Release notes and version identifiers for resources live here so they stay in one place and can be linked from multiple pages.

**Convention:**

- **CHANGES_&lt;slug&gt;.txt** — Changelog for that resource (one entry per line or simple text).
- **VERSION_&lt;slug&gt;.txt** — Current version string (e.g. `1.0.0` or `2024-02-09`).

**Example:** For the King-Queen overlay (slug `king-queen`), add:

- `CHANGES_king-queen.txt`
- `VERSION_king-queen.txt`

Then link from the resource page, e.g.:

```html
<a href="versions-and-changes/CHANGES_king-queen.txt" target="_blank" rel="noopener noreferrer">Changelog</a>
<a href="versions-and-changes/VERSION_king-queen.txt" target="_blank" rel="noopener noreferrer">Version</a>
```

Optional: a “Releases” or “Version history” page could list all CHANGES_*.txt and VERSION_*.txt files.
