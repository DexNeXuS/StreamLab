# CSS split — DexNeXuS Streaming Lab

Styles are split into 11 files and loaded in order from `index.html`. Load order matters (later files can override earlier).

| File | Contents |
|------|----------|
| **variables.css** | `:root` (colors, radii, fonts), `*`, `html`/`body`, `.dx-sr-only`, `.dx-skip-link`, `.dx-container` |
| **header.css** | `.dx-header`, `.dx-header-inner`, `.dx-nav-desktop`, `.dx-header-right`, `.dx-icon-btn`, `.dx-header-social`, `.dx-twitch-slot`, `.dx-search-overlay*`, `.dx-brand`, `.dx-logo`, `.dx-brand-title`, `.dx-brand-subtitle`, `.dx-header-tagline` |
| **nav-mobile.css** | `.dx-nav`, `.dx-nav-toggle`, `.dx-nav-panel`, `.dx-nav-search`, `.dx-input`, `.dx-nav-groups`, `.dx-nav-group*`, `.dx-nav-link*` |
| **layout.css** | `.dx-main`, `.dx-loading`, `.dx-content`, `.dx-card`, content spacing utilities, `.dx-card--img-row`, `.dx-grid`, `.dx-col-*`, page hero, `.dx-page-card`, `.dx-content-img*`, `.dx-badge*` |
| **components.css** | `.dx-btn*`, `.dx-copy-box`, `.dx-accordion`, `.dx-toast*` |
| **footer.css** | `.dx-footer*`, `.dx-link`, `.dx-muted` |
| **cards.css** | `.dx-mentions*`, `.dx-resource-*`, `.dx-widget-card*`, `.dx-inventory-*`, `.dx-import-box*`, `.dx-overlay-url*`, `.dx-discover-*`, `.dx-rota-week-*`, `.dx-related-*`, `.dx-links-icons`, `.dx-link-icon` |
| **tabs-commands.css** | `.dx-tabs`, `.dx-tablist`, `.dx-tab`, `.dx-tabpanel`, `.dx-command-*` |
| **nav-desktop.css** | `.dx-nav-desktop-item`, `.dx-nav-dd-*`, `.dx-nav-desktop-home` |
| **search-results.css** | `.dx-search-results`, `.dx-search-result-link`, nav panel max-width media, `prefers-reduced-motion` |
| **music.css** | `.dx-music-player*`, `.dx-music-btn*`, `.dx-music-tabs`, `.dx-music-tab`, `.dx-music-album*`, `.dx-music-card*` |

**styles.css** — Original single file kept for reference. Not linked from the site; the 11 files above are loaded instead.
