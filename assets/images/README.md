# Images

Put images **anywhere** under `assets/images/`. The site finds them by **filename** — no need to use full paths in JSON or content.

## How it works

1. Run `npm run build:images` (or `npm run build`). This creates `assets/data/image-map.json` — a map of every image filename to its path.
2. In JSON (`pages.json` cardImage, `widgets.json` image) or in content with `data-dx-image`, use just the **filename**: `"html-widgets.png"` or `"twitch-hero.png"`.
3. The site looks up the filename and uses the correct path, no matter which subfolder the file lives in.

## Organize your way

You can structure images however you like:

```
assets/images/
├── page-images/
│   ├── twitch/           ← twitch-hero.png, twitch-obs.png
│   ├── html-widgets/     ← html-widgets.png
│   └── obs/              ← obs.png, obs-setup.png
├── inventory/            ← inventory item images (black-candle.svg, etc.)
└── logo/
```

As long as the file is under `assets/images/`, it will be found. **Filenames must be unique** across the folder (e.g. only one `obs.png`).

## In JSON (filename only)

- **pages.json** `cardImage`: `"html-widgets.png"` or `"assets/images/page-images/html-widgets.png"` (full path still works)
- **widgets.json** `image`: `"simple-clock.png"` — add the file to any subfolder, run `npm run build:images`

## In content HTML

Use `data-dx-image` for filename lookup:

```html
<img data-dx-image="html-widgets.png" alt="..." class="dx-page-card-img" loading="lazy" />
```

Or keep using full paths: `src="assets/images/page-images/html-widgets.png"` — both work.
