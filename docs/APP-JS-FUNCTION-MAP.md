# app.js function map

Map of every function in `app.js`, what it does, what it depends on, and where it could live after splitting. Use this to plan extractions without breaking things.

**Legend**
- **State** = manifest, siteConfig, imageMap, navConfig, contentCache, el, commandsCatalog, musicPlayerState
- **Pure** = no state, no DOM; only arguments and imports

---

## Already extracted

| Function | Now in | Notes |
|---------|--------|--------|
| loadJsonManifest, escapeHtml, normalize, byOrderThenTitle, GROUP_ORDER, groupRank, splitCsv, normalizeForSearch, dateToKey | utils.js | Pure or fetch-only |
| getStreamForDate, getNextStreamFromRota, getRotaWeekEntries | utils.js | Pure rota schedule helpers |
| normalizeWidget, formatTime | utils.js | Pure |
| loadSiteData | data.js | Returns { manifest, siteConfig, imageMap, navConfig } |

---

## Core / orchestration (keep in app.js)

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **loadManifest** | Calls loadSiteData(), assigns to manifest, siteConfig, imageMap, navConfig | loadSiteData | No – thin wrapper |
| **loadContent** | Fetches page HTML, caches, injects into el.content, postProcessContent, renderRelatedInto | el, contentCache, getPageBySlug, updateOpenGraph, postProcessContent, renderRelatedInto | No – core flow |
| **navigateTo** | setRouteSlug, updateNavActive, loadContent, scroll | getPageBySlug, manifest, setRouteSlug, updateNavActive, loadContent | No – core flow |
| **boot** | wireUI, initMusicPlayer, loadManifest, renderNav, renderNavDesktop, navigateTo | Everything | No – entry |

---

## URL / base path / image resolution

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **resolveImagePath** | Resolves image ref (filename or path) using imageMap + base URL | imageMap, getBaseUrlWithSlash | Later – used by many renderers; could pass as dependency |
| **getBaseUrl** | Document origin or siteConfig.baseUrl | siteConfig, location | Same |
| **getBaseUrlWithSlash** | getBaseUrl + trailing slash | getBaseUrl | Same |

---

## DOM refs and global UI helpers

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **el** | Object of DOM element refs (nav, content, toast, etc.) | document.querySelector | No – central refs |
| **showLoading** | Toggles #dxLoading visibility | el.loading | Could go to ui.js with toast/copyText |
| **toast** | Appends a toast message to el.toastHost, auto-removes | el.toastHost | Same |
| **copyText** | navigator.clipboard or fallback | — | Same (used by many) |

---

## Routing / slug helpers

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **getRouteSlug** | Reads ?page= or hash or "home" from URL | location | Could go to a small routing helper |
| **setRouteSlug** | Sets ?page=slug in URL (pushState/replaceState) | location | Same |
| **getPageBySlug** | manifest.pages.find(slug) | manifest | No – or pass manifest in |

---

## Nav (mobile + desktop)

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **groupPages** | Groups pages by group, sorts by byOrderThenTitle | byOrderThenTitle (utils) | nav.js |
| **resolveNavItem** | Nav item → { page } or { submenu }; uses getPageBySlug | getPageBySlug, manifest, navConfig | nav.js |
| **pageMatchesFilter** | Search match for one page | normalize (utils) | nav.js |
| **filterResolvedNavItem** | Recursive filter on resolved nav tree | pageMatchesFilter | nav.js |
| **getPagesAndGroups** | Filtered pages + groupPages + groupNames sorted by groupRank | manifest, normalize, byOrderThenTitle, groupRank, groupPages | nav.js |
| **setNavOpen** | Opens/closes mobile nav panel | el.navPanel, el.navToggle | nav.js or app |
| **updateNavActive** | Sets aria-current on nav links for current slug | document | nav.js |
| **appendPageLink** | Creates one nav link element, click → navigateTo + setNavOpen | pageMatchesFilter, normalize, navigateTo, setNavOpen | nav.js |
| **renderNav** | Builds mobile nav (el.navGroups) from navConfig or getPagesAndGroups | el, navConfig, getPageBySlug, resolveNavItem, filterResolvedNavItem, getPagesAndGroups, appendPageLink | nav.js |
| **renderNavDesktop** | Builds desktop dropdown nav | el.navDesktop, getPageBySlug, navConfig, getPagesAndGroups, escapeHtml, navigateTo, closeAllDesktopDropdowns | nav.js |
| **closeAllDesktopDropdowns** | Closes all desktop nav dropdowns | document | nav.js |

---

## Search and Discover

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **renderSearchResults** | Fills search overlay with matching page links | el.searchResults, manifest, normalize, escapeHtml, navigateTo, setSearchOverlayOpen | search.js |
| **setSearchOverlayOpen** | Shows/hides search overlay, focus, renderSearchResults, refreshDiscoverGrid | el, renderSearchResults, refreshDiscoverGrid | search.js |
| **getSearchFilter** | Value of search input (overlay or panel) | el | search.js |
| **renderDiscoverGrid** | Loads discover.json + widgets.json, builds home grid | container, manifest, normalize, getBaseUrlWithSlash, resolveImagePath, loadJsonManifest, normalizeWidget, escapeHtml, navigateTo | search.js (or render.js) |
| **normalizeWidget** | Normalizes widget config (file, link, page, actions, discoverOrder) | — | ✅ utils.js |
| **refreshDiscoverGrid** | If on home, finds [data-dx-discover] and renderDiscoverGrid | getRouteSlug, el.content, getSearchFilter, renderDiscoverGrid | search.js |

---

## Open Graph

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **updateOpenGraph** | Sets og:title, og:description, og:image in <head> | document, page, resolveImagePath, getBaseUrlWithSlash | app or small meta.js |

---

## Content helpers (copy, links, tabs)

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **initCopyButtons** | Binds [data-copy-id] → copy target text, toast | copyText, toast | app or ui.js |
| **initExternalLinks** | Adds rel=noopener noreferrer to target=_blank | — | **utils.js** (pure DOM scan) or keep |
| **initTabs** | ARIA tabs: [data-dx-tabs], [data-dx-tab], [data-dx-panel] | — | Could be shared component; used by commands, Touch Portal |

---

## Commands catalog

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **badgeForPermission** | Returns HTML for permission badge | escapeHtml | app or commands.js |
| **loadCommandsCatalog** | Fetches commands.json, caches in commandsCatalog | fetch, commandsCatalog state | data.js or commands.js |
| **renderCommandsCatalogInto** | Tabs + command rows + search filter | container, catalog, splitCsv, escapeHtml, normalizeForSearch, initTabs | render.js or commands.js |

---

## Mentions

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **loadMentions** | fetch mentions.json | fetch | data.js or keep |
| **renderMentionsInto** | Renders mention cards | loadMentions, escapeHtml, initExternalLinks | render.js |

---

## Overlays, inventory, widgets, action imports, Touch Portal

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **renderOverlaysInto** | Overlays list + Open/Copy URL | loadJsonManifest, getBaseUrlWithSlash, escapeHtml, copyText, toast, initExternalLinks | render.js |
| **renderInventoryInto** | Inventory cards by category | loadJsonManifest, resolveImagePath, escapeHtml, el | render.js |
| **renderWidgetsInto** | Widget cards or rows, Open/Download/Copy/Page | loadJsonManifest, normalizeWidget, getBaseUrlWithSlash, resolveImagePath, escapeHtml, copyText, toast, navigateTo, initExternalLinks | render.js |
| **renderActionImportsInto** | Action import rows, Copy import | loadJsonManifest, escapeHtml, copyText, toast | render.js |
| **renderTouchPortalTabs** | Touch Portal pages/buttons tabs | fetch touch-portal.json, getBaseUrlWithSlash, escapeHtml, initTabs | render.js |

---

## Music

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **renderMusicPage** | Tabs, albums, track grid; loadJsonManifest(music.json) | loadJsonManifest, resolveImagePath, getBaseUrlWithSlash, escapeHtml, musicPlayerState, playTrack | music.js |
| **playTrack** | Sets audio src, plays, updates player UI | musicPlayerState, getBaseUrlWithSlash, resolveImagePath, document (player els) | music.js |
| **initMusicPlayer** | Binds play/pause/seek/volume/ended | musicPlayerState, playTrack, document | music.js |
| **formatTime** (inside initMusicPlayer) | seconds → "m:ss" | — | ✅ utils.js |

---

## Small content blocks

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **renderOverlayUrlBox** | Single overlay URL + Copy button | getBaseUrlWithSlash, escapeHtml, initCopyButtons | render.js |
| **renderImportBox** | Loads .txt, shows pre + Copy | fetch, escapeHtml, initCopyButtons, initExternalLinks | render.js |
| **renderRelatedInto** | Related pages by group/tags | manifest, escapeHtml, navigateTo | render.js |

---

## Streaming rota (schedule)

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **getStreamForDate** | For one date, returns stream from rota (overrides, recurring, cancelled) | dateToKey (utils) | ✅ utils.js |
| **getNextStreamFromRota** | Next 14 days, first stream with dateFormatted | getStreamForDate | ✅ utils.js |
| **getRotaWeekEntries** | Next 7 days with label/time | getStreamForDate | ✅ utils.js |

---

## Content loading and post-process

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **postProcessContent** | Dispatches to all [data-dx-*] renderers + rota clock + commands | el.content, initCopyButtons, initExternalLinks, initTabs, resolveImagePath, navigateTo, renderMentionsInto, renderOverlaysInto, renderWidgetsInto, renderInventoryInto, renderActionImportsInto, renderImportBox, renderOverlayUrlBox, renderDynamicLinks, renderTouchPortalTabs, renderMusicPage, refreshDiscoverGrid, loadCommandsCatalog, renderCommandsCatalogInto, getNextStreamFromRota, getRotaWeekEntries, fetch streaming-rota | Stays in app – orchestrator |

---

## Header and footer

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **renderHeaderSocials** | Header icon links from siteConfig.links | el.headerSocial, siteConfig, escapeHtml | app or render.js |
| **renderDynamicLinks** | In-content links from siteConfig or loadJsonManifest | siteConfig, loadJsonManifest, escapeHtml, initExternalLinks | render.js |

---

## Event wiring

| Function | What it does | Depends on | Move? |
|----------|--------------|------------|--------|
| **wireUI** | Logo triple-click, nav toggle, click-outside, Escape, search inputs, footer links, copy page link, Twitch demo | el, setNavOpen, navigateTo, renderNav, refreshDiscoverGrid, setSearchOverlayOpen, renderSearchResults, copyText, toast | Stays in app |

---

## Safe next extractions (no behaviour change)

1. ~~**Rota helpers → utils.js**~~ ✅ Done.
2. ~~**normalizeWidget → utils.js**~~ ✅ Done.
3. ~~**formatTime → utils.js**~~ ✅ Done.
4. **initExternalLinks** — Could go to utils (scans scope for `a[target="_blank"]`, sets rel). Small, used in many places. Optional.

After that, next steps are larger: **nav.js** (all nav + search/discover) or **render.js** (all render*Into) with dependency injection or a shared context object so they can still use manifest, el, resolveImagePath, etc.
