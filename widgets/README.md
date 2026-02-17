# Widgets

Browser-source widgets for OBS. Each widget is a standalone HTML file in this folder.

## Adding a widget

1. Add your `.html` file to this folder.
2. Edit **`assets/data/widgets.json`** and add an entry:

```json
{
  "id": "my-widget",
  "name": "My Widget",
  "description": "What it does.",
  "image": null,
  "file": "my-widget.html",
  "link": null,
  "showOnDiscover": false,
  "actions": ["download", "copyUrl", "open"],
  "discoverOrder": 50
}
```

- **name**, **description**, **file**: Required (or inferred from file).
- **image**: Optional preview image path or URL.
- **link**: Optional hosted URL (e.g. GitHub Pages). If set, adds "Open" and uses it for "Copy URL".
- **showOnDiscover**: If `true`, widget can appear on the home Discover grid (when using fallback order; see discover.json).
- **actions**: Optional. `["download","copyUrl","open"]`. If omitted, inferred from `file` and `link`.
- **howtoFile**: Optional. Filename of the how-to guide in `widgets/howto/` (e.g. `"typewriter.md"`). Adds a "How to" button that opens the guide in a new tab.
- **discoverOrder**: Sort order when `showOnDiscover` is used. Default 50.

**Single source:** Edit `assets/data/widgets.json` only — no build step.

**How-tos:** Put a `howto/<name>.md` in this folder and set `"howtoFile": "<name>.md"` in the widget entry. The How to button links to `widgets/howto/<name>.md`.
