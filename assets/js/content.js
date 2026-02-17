/* DexNeXuS — Streaming Lab — content renderers (commands, mentions, overlays, widgets, tabs, etc.)
   createContent(api) returns initTabs, loadCommandsCatalog, loadMentions, badgeForPermission,
   renderCommandsCatalogInto, renderMentionsInto, renderOverlaysInto, renderInventoryInto,
   renderWidgetsInto, renderOverlayUrlBox, renderImportBox, renderActionImportsInto,
   renderTouchPortalTabs, renderRelatedInto, renderDynamicLinks, renderHeaderSocials, renderEmotesInto. */

import {
  escapeHtml,
  splitCsv,
  normalizeForSearch,
  normalizeWidget,
} from "./utils.js";

/**
 * @param {{
 *   getManifest: () => { pages: Array<{ slug: string, title: string, group?: string, tags?: string[], hideFromNav?: boolean }> },
 *   getSiteConfig: () => { links?: Array<{ label: string, href: string, icon?: string }> } | null,
 *   setSiteConfig: (partial: { links?: Array<{ label: string, href: string, icon?: string }> }) => void,
 *   getBaseUrlWithSlash: () => string,
 *   resolveImagePath: (ref: string, base?: string) => string,
 *   loadJsonManifest: (path: string) => Promise<unknown>,
 *   navigateTo: (slug: string, replace?: boolean) => Promise<void>,
 *   escapeHtml: (s: string) => string,
 *   copyText: (value: string) => Promise<boolean>,
 *   toast: (title: string, text: string, isSuccess?: boolean) => void,
 *   initCopyButtons: (scope: HTMLElement) => void,
 *   initExternalLinks: (scope: HTMLElement) => void,
 *   el: { headerSocial: HTMLElement | null },
 *   getNextStreamFromRota: (rota: unknown) => { label: string, dateFormatted: string, time?: string } | null,
 *   getRotaWeekEntries: (rota: unknown) => Array<{ dateFormatted: string, label?: string, time?: string }>,
 * }} api
 */
export function createContent(api) {
  const {
    getManifest,
    getSiteConfig,
    setSiteConfig,
    getBaseUrlWithSlash,
    resolveImagePath,
    loadJsonManifest,
    navigateTo,
    copyText,
    toast,
    initCopyButtons,
    initExternalLinks,
    el,
    getNextStreamFromRota,
    getRotaWeekEntries,
  } = api;

  /** @type {null | { groups: Record<string, { icon?: string, title?: string, commands: Record<string, { description?: string, permissions?: string }> }> }} */
  let commandsCatalog = null;
  let commandsCatalogPromise = null;

  function badgeForPermission(perm) {
    const p = (perm || "").trim().toLowerCase();
    if (!p) return `<span class="dx-badge">viewer</span>`;
    if (p === "mod") return `<span class="dx-badge dx-badge--purple">mod</span>`;
    return `<span class="dx-badge">${escapeHtml(p)}</span>`;
  }

  async function loadCommandsCatalog() {
    if (commandsCatalog) return commandsCatalog;
    if (commandsCatalogPromise) return commandsCatalogPromise;
    commandsCatalogPromise = (async () => {
      const res = await fetch("assets/data/commands.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to load commands catalog (${res.status})`);
      const data = await res.json();
      if (!data || typeof data !== "object" || !data.groups) throw new Error("Invalid commands catalog format");
      commandsCatalog = data;
      return data;
    })();
    return commandsCatalogPromise;
  }

  function initTabs(scope) {
    const root = scope || document.body;
    root.querySelectorAll("[data-dx-tabs]").forEach((tabsEl) => {
      const tabButtons = Array.from(tabsEl.querySelectorAll("[data-dx-tab]"));
      const panels = Array.from(tabsEl.querySelectorAll("[data-dx-panel]"));
      if (!tabButtons.length || !panels.length) return;

      function activate(tabId) {
        tabButtons.forEach((btn) => {
          const isActive = btn.getAttribute("data-dx-tab") === tabId;
          btn.setAttribute("aria-selected", isActive ? "true" : "false");
          btn.setAttribute("tabindex", isActive ? "0" : "-1");
        });
        panels.forEach((panel) => {
          const isActive = panel.getAttribute("data-dx-panel") === tabId;
          panel.hidden = !isActive;
        });
      }

      tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-dx-tab");
          if (!id) return;
          activate(id);
        });
        btn.addEventListener("keydown", (e) => {
          const currentIndex = tabButtons.indexOf(btn);
          if (currentIndex === -1) return;
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const dir = e.key === "ArrowRight" ? 1 : -1;
            const nextIndex = (currentIndex + dir + tabButtons.length) % tabButtons.length;
            const nextBtn = tabButtons[nextIndex];
            nextBtn.focus();
            const id = nextBtn.getAttribute("data-dx-tab");
            if (id) activate(id);
          }
        });
      });

      const preselected = tabButtons.find((b) => b.getAttribute("aria-selected") === "true");
      const initial = (preselected || tabButtons[0]).getAttribute("data-dx-tab");
      if (initial) activate(initial);
    });
  }

  function renderCommandsCatalogInto(container, catalog) {
    const groupFilter = splitCsv(container.getAttribute("data-group-filter"));
    const groupOrderOverride = splitCsv(container.getAttribute("data-group-order"));
    const allGroupNames = Object.keys(catalog.groups || {});
    const filteredGroupNames = groupFilter.length ? allGroupNames.filter((g) => groupFilter.includes(g)) : allGroupNames;
    const groupRank = (g) => {
      const idx = groupOrderOverride.indexOf(g);
      return idx === -1 ? 999 : idx;
    };
    const groupNames = filteredGroupNames.sort((a, b) => {
      const ra = groupRank(a);
      const rb = groupRank(b);
      if (ra !== rb) return ra - rb;
      return a.localeCompare(b);
    });

    const permissionKey = (p) => ((p || "").trim().toLowerCase() === "mod" ? "mod" : "viewer");

    const tabsId = `dxcmd-${Math.random().toString(16).slice(2)}`;
    let tabButtonsHtml = "";
    let panelsHtml = "";

    groupNames.forEach((groupName, idx) => {
      const group = catalog.groups[groupName];
      if (!group || !group.commands) return;
      const icon = group.icon ? `${escapeHtml(group.icon)} ` : "";
      const label = group.title && group.title.trim().length ? group.title.trim() : groupName;
      const selected = idx === 0 ? "true" : "false";
      const hidden = idx === 0 ? "" : " hidden";

      tabButtonsHtml += `
        <button class="dx-tab" type="button" role="tab" aria-selected="${selected}" data-dx-tab="${escapeHtml(groupName)}">
          ${icon}${escapeHtml(label)}
        </button>
      `;

      const entries = Object.entries(group.commands)
        .map(([name, info]) => ({ name, description: info?.description || "", permissions: info?.permissions || "" }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const rowsHtml = entries
        .map(
          (c) => {
            const perm = permissionKey(c.permissions);
            return `
            <div class="dx-command-row" data-dx-command-row data-permission="${perm}" data-search="${escapeHtml(normalizeForSearch(`${c.name} ${c.description} ${c.permissions}`))}">
              <div class="dx-command-name">${escapeHtml(c.name)}</div>
              <div class="dx-command-desc">${escapeHtml(c.description || "")}</div>
              <div class="dx-command-meta">${badgeForPermission(c.permissions)}</div>
            </div>
          `;
          }
        )
        .join("");

      panelsHtml += `
        <section class="dx-tabpanel" data-dx-panel="${escapeHtml(groupName)}"${hidden}>
          <div class="dx-card">
            <div class="dx-command-toolbar">
              <input class="dx-command-search" type="search" placeholder="Search commands in this group…" data-dx-command-search />
              <div class="dx-muted">Commands: ${entries.length}</div>
            </div>
            <div class="dx-command-list" data-dx-command-list>${rowsHtml}</div>
          </div>
        </section>
      `;
    });

    container.innerHTML = `
      <div class="dx-command-permission-filter" role="group" aria-label="Filter by permission">
        <span class="dx-command-filter-label">Show:</span>
        <button type="button" class="dx-command-filter-btn dx-command-filter-btn--active" data-dx-permission-filter="all">All</button>
        <button type="button" class="dx-command-filter-btn" data-dx-permission-filter="viewer">Viewer</button>
        <button type="button" class="dx-command-filter-btn" data-dx-permission-filter="mod">Mod</button>
      </div>
      <section class="dx-tabs" data-dx-tabs id="${tabsId}">
        <div class="dx-tablist" role="tablist" aria-label="Command groups">${tabButtonsHtml}</div>
        ${panelsHtml}
      </section>
    `;
    initTabs(container);

    function applyPermissionFilter(permission) {
      container.querySelectorAll("[data-dx-permission-filter]").forEach((btn) => {
        btn.classList.toggle("dx-command-filter-btn--active", btn.getAttribute("data-dx-permission-filter") === permission);
      });
      container.querySelectorAll("[data-dx-command-row]").forEach((row) => {
        const rowPerm = row.getAttribute("data-permission") || "viewer";
        const show = permission === "all" || rowPerm === permission;
        const searchMatch = row.closest("[data-dx-panel]")?.querySelector("[data-dx-command-search]")
          ? (() => {
              const input = row.closest("[data-dx-panel]").querySelector("[data-dx-command-search]");
              const q = normalizeForSearch(input?.value || "");
              const hay = row.getAttribute("data-search") || "";
              return !q || hay.includes(q);
            })()
          : true;
        row.style.display = show && searchMatch ? "" : "none";
      });
    }

    container.querySelectorAll("[data-dx-permission-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const permission = btn.getAttribute("data-dx-permission-filter") || "all";
        applyPermissionFilter(permission);
      });
    });

    container.querySelectorAll("[data-dx-command-search]").forEach((input) => {
      input.addEventListener("input", () => {
        const q = normalizeForSearch(input.value || "");
        const panel = input.closest("[data-dx-panel]");
        if (!panel) return;
        const activeFilter = container.querySelector("[data-dx-permission-filter].dx-command-filter-btn--active")?.getAttribute("data-dx-permission-filter") || "all";
        panel.querySelectorAll("[data-dx-command-row]").forEach((row) => {
          const hay = row.getAttribute("data-search") || "";
          const searchMatch = !q || hay.includes(q);
          const rowPerm = row.getAttribute("data-permission") || "viewer";
          const permMatch = activeFilter === "all" || rowPerm === activeFilter;
          row.style.display = searchMatch && permMatch ? "" : "none";
        });
      });
    });
  }

  async function loadMentions() {
    const res = await fetch("assets/data/mentions.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load mentions (${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid mentions format");
    return data;
  }

  function renderMentionsInto(container) {
    loadMentions()
      .then((list) => {
        container.innerHTML = list
          .map(
            (item) => `
          <a href="${escapeHtml(item.url || "#")}" target="_blank" rel="noopener noreferrer" class="dx-mentions-card" role="listitem">
            <span class="dx-mentions-name">${escapeHtml(item.name || "—")}</span>
            ${item.description ? `<span class="dx-mentions-desc">${escapeHtml(item.description)}</span>` : ""}
          </a>
        `
          )
          .join("");
        initExternalLinks(container);
      })
      .catch(() => {
        container.innerHTML = "<p class=\"dx-muted\">Couldn't load mentions.</p>";
      });
  }

  function renderEmotesInto(container) {
    if (!container) return;
    const base = getBaseUrlWithSlash();
    const emotesBase = base + "assets/images/page-images/emotes/";
    loadJsonManifest("assets/data/emotes.json")
      .then((data) => {
        const sets = data.sets || [];
        if (!sets.length) {
          container.innerHTML = "<p class=\"dx-muted\">No emote sets yet.</p>";
          return;
        }
        container.innerHTML = sets
          .map((set) => {
            const id = set.id || "";
            const name = set.name || id;
            const desc = (set.description || "Click to view full size").trim();
            const sizes = Array.isArray(set.sizes) ? set.sizes : ["56"];
            const bestSize = sizes.length ? sizes[sizes.length - 1] : "56";
            const imgSrc = `${emotesBase}${escapeHtml(id)}/${escapeHtml(id)}_${bestSize}.png`;
            return `<article class="dx-discover-card dx-emote-card" role="button" tabindex="0">
              <div class="dx-discover-card-image dx-emote-card-image-wrap">
                <img src="${imgSrc}" alt="${escapeHtml(name)}" width="${bestSize}" height="${bestSize}" loading="lazy" data-dx-emote-src="${escapeHtml(imgSrc)}" class="dx-emote-card-img" />
              </div>
              <div class="dx-discover-card-body">
                <h3 class="dx-discover-card-title">${escapeHtml(name)}</h3>
                <p class="dx-discover-card-desc">${escapeHtml(desc)}</p>
              </div>
            </article>`;
          })
          .join("");
        initEmoteLightbox(container);
      })
      .catch(() => {
        container.innerHTML = "<p class=\"dx-muted\">Couldn't load emotes.</p>";
      });
  }

  function initEmoteLightbox(container) {
    let overlay = document.getElementById("dx-emote-lightbox");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "dx-emote-lightbox";
      overlay.className = "dx-emote-lightbox";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = `<div class="dx-emote-lightbox-backdrop"><img src="" alt="" class="dx-emote-lightbox-img" /></div>`;
      overlay.addEventListener("click", () => {
        overlay.classList.remove("dx-emote-lightbox--open");
        overlay.setAttribute("aria-hidden", "true");
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay.classList.contains("dx-emote-lightbox--open")) {
          overlay.classList.remove("dx-emote-lightbox--open");
          overlay.setAttribute("aria-hidden", "true");
        }
      });
      document.body.appendChild(overlay);
    }
    const img = overlay.querySelector(".dx-emote-lightbox-img");
    container.querySelectorAll(".dx-emote-card").forEach((card) => {
      card.style.cursor = "pointer";
      card.addEventListener("click", (e) => {
        e.preventDefault();
        const srcEl = card.querySelector("[data-dx-emote-src]");
        const src = srcEl ? srcEl.getAttribute("data-dx-emote-src") : card.querySelector(".dx-emote-card-img")?.src;
        if (src && img) {
          img.src = src;
          img.alt = (card.querySelector(".dx-discover-card-title")?.textContent || "").trim();
          overlay.classList.add("dx-emote-lightbox--open");
          overlay.setAttribute("aria-hidden", "false");
        }
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });
    });
  }

  function renderOverlaysInto(container) {
    loadJsonManifest("assets/data/overlays.json")
      .then((data) => {
        const list = data.overlays || [];
        if (!list.length) {
          container.innerHTML = '<p class="dx-muted">No overlays listed yet. Add entries to <code>assets/data/overlays.json</code>.</p>';
          return;
        }
        const fullBase = getBaseUrlWithSlash();
        container.innerHTML = list
          .map((item) => {
            const file = item.file || (item.id ? item.id + ".html" : "");
            const relPath = file ? `obs/overlays/${file}` : "#";
            const fullUrl = file ? fullBase + relPath : "#";
            const pageSlug = item.pageSlug || "";
            const detailsLink = pageSlug ? `<a href="?page=${encodeURIComponent(pageSlug)}" class="dx-btn">Details</a>` : "";
            return `
            <div class="dx-resource-row">
              <div class="dx-resource-info">
                <span class="dx-resource-name">${escapeHtml(item.name || item.id || "—")}</span>
                ${item.description ? `<span class="dx-resource-desc">${escapeHtml(item.description)}</span>` : ""}
              </div>
              <div class="dx-resource-actions">
                <a href="${escapeHtml(relPath)}" target="_blank" rel="noopener noreferrer" class="dx-btn">Open</a>
                <button type="button" class="dx-btn dx-btn--primary" data-copy-url="${escapeHtml(fullUrl)}">Copy URL</button>
                ${detailsLink}
              </div>
            </div>
          `;
          })
          .join("");
        container.querySelectorAll("[data-copy-url]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const url = btn.getAttribute("data-copy-url");
            if (url) {
              const ok = await copyText(url);
              toast(ok ? "Copied" : "Copy failed", ok ? "URL copied to clipboard." : "Clipboard access blocked.", ok);
            }
          });
        });
        initExternalLinks(container);
      })
      .catch(() => {
        container.innerHTML = "<p class=\"dx-muted\">Couldn't load overlays list.</p>";
      });
  }

  function renderInventoryInto(container) {
    const category = container.getAttribute("data-category");
    if (!category) return;
    loadJsonManifest("assets/data/inventory.json")
      .then((data) => {
        const cats = data.categories || {};
        const cat = cats[category];
        if (!cat || !cat.items || !cat.items.length) {
          container.innerHTML = '<p class="dx-muted">No items in this category. Edit <code>assets/data/inventory.json</code>.</p>';
          return;
        }
        const fullBase = getBaseUrlWithSlash();
        container.innerHTML = cat.items
          .map((item) => {
            const imgSrc = item.image ? resolveImagePath(item.image, fullBase) : "";
            const imgHtml = imgSrc
              ? `<img src="${escapeHtml(imgSrc)}" alt="" class="dx-inventory-card-img" loading="lazy" />`
              : '<div class="dx-widget-card-placeholder"><span class="iconify" data-icon="mdi:package-variant" aria-hidden="true"></span></div>';
            const meta = [item.price, item.tags].filter(Boolean).join(" • ");
            let body = "";
            if (item.flavour) body += `<p class="dx-inventory-card-flavour">${escapeHtml(item.flavour)}</p>`;
            if (item.effect) body += `<p class="dx-inventory-card-effect"><strong>Effect:</strong> ${escapeHtml(item.effect)}</p>`;
            if (item.recipe) body += `<p class="dx-inventory-card-effect"><strong>Recipe:</strong> ${escapeHtml(item.recipe)}</p>`;
            if (item.obtainable) body += `<p class="dx-inventory-card-effect"><strong>Obtainable:</strong> ${escapeHtml(item.obtainable)}</p>`;
            if (item.use) body += `<p class="dx-inventory-card-effect"><strong>Use:</strong> ${escapeHtml(item.use)}</p>`;
            if (item.limit) body += `<p class="dx-inventory-card-effect"><strong>Limit:</strong> ${escapeHtml(item.limit)}</p>`;
            return `
            <div class="dx-inventory-card" id="inv-${escapeHtml(item.id)}">
              <div class="dx-inventory-card-img-wrap">${imgHtml}</div>
              <div class="dx-inventory-card-body">
                <h3 class="dx-inventory-card-title">${escapeHtml(item.name || item.id)}</h3>
                ${meta ? `<p class="dx-inventory-card-meta">${escapeHtml(meta)}</p>` : ""}
                ${body}
              </div>
            </div>
          `;
          })
          .join("");
        if (container.classList.contains("dx-inventory-cards") && typeof window.iconify !== "undefined") {
          window.iconify.scan(container);
        }
      })
      .catch(() => {
        container.innerHTML = '<p class="dx-muted">Could not load inventory. Check <code>assets/data/inventory.json</code>.</p>';
      });
  }

  function renderWidgetsInto(container) {
    const isCards = container.classList.contains("dx-widget-cards");
    const context = container.getAttribute("data-context") || "";
    loadJsonManifest("assets/data/widgets.json")
      .then((data) => {
        let list = (data.widgets || []).map(normalizeWidget);
        if (context === "twitch") list = list.filter((w) => w.showOnTwitch);
        else list = list.filter((w) => !w.showOnTwitch);
        if (!list.length) {
          container.innerHTML = '<p class="dx-muted">No widgets yet. Edit <code>assets/data/widgets.json</code>.</p>';
          return;
        }
        const fullBase = getBaseUrlWithSlash();
        if (isCards) {
          container.innerHTML = list
            .map((item) => {
              const file = item.file || (item.id ? item.id + ".html" : "");
              const relPath = file ? `widgets/${file}` : "";
              const fullUrl = item.link || (relPath ? fullBase + relPath : "");
              const acts = item.actions || [];
              const hasImage = !!item.image;
              const imgSrc = hasImage ? resolveImagePath(item.image, fullBase) : "";
              const imgHtml = imgSrc
                ? `<img src="${escapeHtml(imgSrc)}" alt="" class="dx-widget-card-img" loading="lazy" />`
                : '<div class="dx-widget-card-placeholder"><span class="iconify" data-icon="mdi:widgets" aria-hidden="true"></span></div>';
              const noImageClass = hasImage ? "" : " dx-widget-card--no-image";
              let actions = "";
              if (acts.includes("page") && item.page) {
                actions += `<a href="?page=${encodeURIComponent(item.page)}" class="dx-btn dx-btn--primary" data-dx-page="${escapeHtml(item.page)}">${escapeHtml(item.buttonLabel || "Go to page")}</a>`;
              }
              if (acts.includes("open") && (item.link || fullUrl)) {
                actions += `<a href="${escapeHtml(item.link || fullUrl)}" target="_blank" rel="noopener noreferrer" class="dx-btn">Open</a>`;
              }
              if (acts.includes("download") && file) {
                actions += `<a href="${escapeHtml(relPath)}" download class="dx-btn">Download</a>`;
              }
              if (acts.includes("copyUrl") && (item.link || fullUrl)) {
                actions += `<button type="button" class="dx-btn dx-btn--primary" data-copy-url="${escapeHtml(item.link || fullUrl)}">Copy URL</button>`;
              }
              if (item.file) {
                const howtoPath = "widgets/howto/" + (item.howtoFile || item.id + ".md");
                const viewerHref = "?page=viewer&path=" + encodeURIComponent(howtoPath);
                actions += `<a href="${escapeHtml(viewerHref)}" class="dx-btn" title="How to use">How to</a>`;
              }
              return `
              <div class="dx-widget-card${noImageClass}" id="${escapeHtml(item.id)}">
                <div class="dx-widget-card-img-wrap">${imgHtml}</div>
                <div class="dx-widget-card-body">
                  <h3 class="dx-widget-card-title">${escapeHtml(item.name || item.id || "—")}</h3>
                  ${item.description ? `<p class="dx-widget-card-desc">${escapeHtml(item.description)}</p>` : ""}
                  <div class="dx-widget-card-actions">${actions}</div>
                </div>
              </div>
            `;
            })
            .join("");
        } else {
          container.innerHTML = list
            .map((item) => {
              const file = item.file || (item.id ? item.id + ".html" : "");
              const relPath = file ? `widgets/${file}` : "#";
              const fullUrl = item.link || (relPath !== "#" ? fullBase + relPath : "#");
              const acts = item.actions || [];
              let rowActions = "";
              if (acts.includes("page") && item.page) {
                rowActions += `<a href="?page=${encodeURIComponent(item.page)}" class="dx-btn dx-btn--primary" data-dx-page="${escapeHtml(item.page)}">${escapeHtml(item.buttonLabel || "Go to page")}</a>`;
              }
              if (acts.includes("open") && (item.link || fullUrl)) {
                rowActions += `<a href="${escapeHtml(item.link || fullUrl)}" target="_blank" rel="noopener noreferrer" class="dx-btn">Open</a>`;
              }
              if (acts.includes("download") && file) {
                rowActions += `<a href="${escapeHtml(relPath)}" download class="dx-btn">Download</a>`;
              }
              if (acts.includes("copyUrl") && (item.link || fullUrl)) {
                rowActions += `<button type="button" class="dx-btn dx-btn--primary" data-copy-url="${escapeHtml(item.link || fullUrl)}">Copy URL</button>`;
              }
              if (item.file) {
                const howtoPath = "widgets/howto/" + (item.howtoFile || item.id + ".md");
                const viewerHref = "?page=viewer&path=" + encodeURIComponent(howtoPath);
                rowActions += `<a href="${escapeHtml(viewerHref)}" class="dx-btn" title="How to use">How to</a>`;
              }
              return `
            <div class="dx-resource-row">
              <div class="dx-resource-info">
                <span class="dx-resource-name">${escapeHtml(item.name || item.id || "—")}</span>
                ${item.description ? `<span class="dx-resource-desc">${escapeHtml(item.description)}</span>` : ""}
              </div>
              <div class="dx-resource-actions">${rowActions}</div>
            </div>`;
            })
            .join("");
        }
        container.querySelectorAll("[data-copy-url]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const url = btn.getAttribute("data-copy-url");
            if (url) {
              const ok = await copyText(url);
              toast(ok ? "Copied" : "Copy failed", ok ? "URL copied to clipboard." : "Clipboard access blocked.", ok);
            }
          });
        });
        container.querySelectorAll("a[data-dx-page]").forEach((a) => {
          a.addEventListener("click", (e) => {
            e.preventDefault();
            const slug = a.getAttribute("data-dx-page");
            if (slug) navigateTo(slug);
          });
        });
        container.querySelectorAll('a[href*="page=viewer"]').forEach((a) => {
          a.addEventListener("click", (e) => {
            e.preventDefault();
            const href = a.getAttribute("href");
            if (href) {
              window.history.pushState({}, "", href);
              navigateTo("viewer", true);
            }
          });
        });
        initExternalLinks(container);
        if (isCards && typeof window.iconify !== "undefined") {
          window.iconify.scan(container);
        }
      })
      .catch(() => {
        container.innerHTML = '<p class="dx-muted">Could not load widgets list. Check <code>assets/data/widgets.json</code>.</p>';
      });
  }

  function renderOverlayUrlBox(container) {
    const file = container.getAttribute("data-dx-overlay-url");
    if (!file) return;
    const fullBase = getBaseUrlWithSlash();
    const fullUrl = fullBase + "obs/overlays/" + file.replace(/^\/+/, "");
    const id = "dx-ov-" + Math.random().toString(36).slice(2, 9);
    container.innerHTML = `
      <div class="dx-overlay-url-wrap">
        <p class="dx-overlay-url-text" id="${id}-text">${escapeHtml(fullUrl)}</p>
        <span id="${id}" data-copy-text="${escapeHtml(fullUrl)}" class="dx-sr-only" aria-hidden="true"></span>
        <div class="dx-overlay-url-actions">
          <a href="${escapeHtml(fullUrl)}" target="_blank" rel="noopener noreferrer" class="dx-btn">Open</a>
          <button type="button" class="dx-btn dx-btn--primary" data-copy-id="${id}">Copy URL</button>
        </div>
      </div>
    `;
    initCopyButtons(container);
  }

  function renderImportBox(container) {
    const path = container.getAttribute("data-dx-import-box");
    if (!path) return;
    container.innerHTML = '<p class="dx-muted">Loading import string…</p>';
    fetch(path, { cache: "no-cache" })
      .then((res) => res.text())
      .then((data) => {
        const fullText = data.trim();
        const id = "dx-import-" + Math.random().toString(36).slice(2, 9);
        container.innerHTML = `
          <div class="dx-import-box-wrap">
            <pre class="dx-import-string" id="${id}-pre" aria-label="Import string"></pre>
            <span id="${id}" data-copy-text="${escapeHtml(fullText)}" class="dx-sr-only" aria-hidden="true"></span>
            <div class="dx-import-box-actions">
              <button type="button" class="dx-btn dx-btn--primary" data-copy-id="${id}">Copy</button>
              <a href="${escapeHtml(path)}" download class="dx-btn" title="Download .txt file">Download</a>
              <a href="${escapeHtml(path)}" target="_blank" rel="noopener noreferrer" class="dx-btn" title="Open .txt file in new tab">Open</a>
            </div>
          </div>
          <p class="dx-muted dx-mt-1" style="font-size: 13px;">Paste into Streamer.bot: Import → Import from clipboard. Content loaded from <a class="dx-link" href="${escapeHtml(path)}" target="_blank" rel="noopener noreferrer">${escapeHtml(path)}</a>.</p>
        `;
        const pre = container.querySelector(".dx-import-string");
        if (pre) pre.textContent = fullText;
        initCopyButtons(container);
        initExternalLinks(container);
      })
      .catch(() => {
        container.innerHTML = '<p class="dx-muted">Could not load import string. Check that the file exists.</p><p class="dx-muted">File path: <code>' + escapeHtml(path) + "</code></p>";
      });
  }

  function renderActionImportsInto(container) {
    loadJsonManifest("assets/data/action-imports.json")
      .then((list) => {
        if (!Array.isArray(list) || !list.length) {
          container.innerHTML = '<p class="dx-muted">No action imports listed. Add entries to <code>assets/data/action-imports.json</code>.</p>';
          return;
        }
        container.innerHTML = list
          .map(
            (item) => {
              const pageSlug = item.pageSlug || "";
              const file = item.file || "";
              const detailsLink = pageSlug ? `<a href="?page=${encodeURIComponent(pageSlug)}" class="dx-btn">Details</a>` : "";
              const openFileLink = file ? `<a href="${escapeHtml(file)}" target="_blank" rel="noopener noreferrer" class="dx-btn" title="Open .txt file">Open</a>` : "";
              const downloadLink = file ? `<a href="${escapeHtml(file)}" download class="dx-btn" title="Download .txt file">Download</a>` : "";
              return `
          <div class="dx-resource-row dx-action-import-row">
            <div class="dx-resource-info">
              <span class="dx-resource-name">${escapeHtml(item.name || item.id || "—")}</span>
              ${item.description ? `<span class="dx-resource-desc">${escapeHtml(item.description)}</span>` : ""}
            </div>
            <div class="dx-resource-actions">
              ${detailsLink}
              ${openFileLink}
              ${downloadLink}
              <button type="button" class="dx-btn dx-btn--primary" data-dx-import-file="${escapeHtml(file)}">Copy</button>
            </div>
          </div>
        `;
            }
          )
          .join("");
        container.querySelectorAll("[data-dx-import-file]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const file = btn.getAttribute("data-dx-import-file");
            if (!file) return;
            try {
              const res = await fetch(file, { cache: "no-cache" });
              const text = await res.text();
              const ok = await copyText(text);
              toast(ok ? "Copied" : "Copy failed", ok ? "Import string copied. Paste into Streamer.bot." : "Clipboard access blocked.", ok);
            } catch {
              toast("Copy failed", "Could not load the import file.");
            }
          });
        });
      })
      .catch(() => {
        container.innerHTML = "<p class=\"dx-muted\">Couldn't load action imports list.</p>";
      });
  }

  function renderTouchPortalTabs(container) {
    if (!container) return;
    fetch("assets/data/touch-portal.json", { cache: "no-cache" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("fetch failed"))))
      .then((data) => {
        const pages = data.pages || [];
        const buttons = data.buttons || [];
        const base = getBaseUrlWithSlash();
        const makeItem = (item, folder) => {
          const filePath = item.file ? `touch-portal/${folder}/${item.file}` : null;
          const downloadLink = filePath ? `<a href="${base}${filePath}" download class="dx-btn dx-btn--primary">Download</a>` : "";
          return `
            <div class="dx-resource-row">
              <div class="dx-resource-info">
                <span class="dx-resource-name">${escapeHtml(item.name || item.id || "—")}</span>
                ${item.description ? `<span class="dx-resource-desc">${escapeHtml(item.description)}</span>` : ""}
              </div>
              <div class="dx-resource-actions">${downloadLink}</div>
            </div>
          `;
        };
        const pagesHtml = pages.length ? pages.map((p) => makeItem(p, "pages")).join("") : '<p class="dx-muted">No pages yet. Add entries to <code>touch-portal/pages/index.json</code> and run <code>node tools/build-touch-portal.mjs</code>.</p>';
        const buttonsHtml = buttons.length ? buttons.map((b) => makeItem(b, "buttons")).join("") : '<p class="dx-muted">No buttons yet. Add entries to <code>touch-portal/buttons/index.json</code> and run <code>node tools/build-touch-portal.mjs</code>.</p>';
        container.innerHTML = `
          <section class="dx-tabs" data-dx-tabs id="dx-tp-tabs">
            <div class="dx-tablist" role="tablist" aria-label="Touch Portal sections">
              <button class="dx-tab" type="button" role="tab" aria-selected="true" data-dx-tab="tp-pages">Pages</button>
              <button class="dx-tab" type="button" role="tab" aria-selected="false" data-dx-tab="tp-buttons">Buttons</button>
            </div>
            <section class="dx-tabpanel" data-dx-panel="tp-pages">
              <div class="dx-card">
                <h2 class="dx-heading-reset">Pages</h2>
                <p class="dx-muted dx-mb-1">Touch Portal page layouts. Drop .tpb files into <code>touch-portal/pages/</code> and add them to <code>pages/index.json</code>.</p>
                <div class="dx-resource-list">${pagesHtml}</div>
              </div>
            </section>
            <section class="dx-tabpanel" data-dx-panel="tp-buttons" hidden>
              <div class="dx-card">
                <h2 class="dx-heading-reset">Buttons</h2>
                <p class="dx-muted dx-mb-1">Individual button sets. Drop .tpb files into <code>touch-portal/buttons/</code> and add them to <code>buttons/index.json</code>.</p>
                <div class="dx-resource-list">${buttonsHtml}</div>
              </div>
            </section>
          </section>
        `;
        initTabs(container);
      })
      .catch(() => {
        container.innerHTML = "<p class=\"dx-muted\">Couldn't load Touch Portal list. Run <code>node tools/build-touch-portal.mjs</code> to generate <code>assets/data/touch-portal.json</code>.</p>";
      });
  }

  function renderRelatedInto(container, currentSlug) {
    const manifest = getManifest();
    if (!container || !manifest.pages) return;
    const current = manifest.pages.find((p) => p.slug === currentSlug);
    const others = manifest.pages.filter((p) => !p.hideFromNav && p.slug !== currentSlug && p.slug !== "home");
    const currentGroup = current && current.group ? current.group : "";
    const currentTags = new Set(current && current.tags ? current.tags : []);
    const related = others
      .filter((p) => {
        if (currentGroup && p.group === currentGroup) return true;
        const pTags = p.tags || [];
        return pTags.some((t) => currentTags.has(t));
      })
      .slice(0, 6);

    if (related.length === 0) {
      container.innerHTML = "";
      container.style.display = "none";
      return;
    }
    container.style.display = "";
    container.innerHTML = `
      <h2 class="dx-heading-reset">Related</h2>
      <ul class="dx-related-list" aria-label="Related pages">
        ${related.map((p) => `<li><a class="dx-link" href="?page=${encodeURIComponent(p.slug)}" data-dx-page="${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a></li>`).join("")}
      </ul>
    `;
    container.querySelectorAll("[data-dx-page]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const slug = a.getAttribute("data-dx-page");
        if (slug) navigateTo(slug);
      });
    });
  }

  function renderDynamicLinks(container) {
    function putLinks(links) {
      if (!links || !Array.isArray(links) || links.length === 0) {
        container.innerHTML = '<p class="dx-muted">Add <code>links</code> in <code>assets/data/site-config.json</code> to show links here. Each item: <code>{ "label": "Name", "href": "https://...", "icon": "simple-icons:github" }</code>.</p>';
        return;
      }
      container.innerHTML = `
      <div class="dx-links-icons" aria-label="Quick links" class="dx-mt-1">
        ${links
          .map(
            (l) => `
          <a href="${escapeHtml(l.href || "#")}" target="_blank" rel="noopener noreferrer" class="dx-link-icon" aria-label="${escapeHtml(l.label || "Link")}">
            ${l.icon ? `<span class="iconify" data-icon="${escapeHtml(l.icon)}" aria-hidden="true"></span>` : escapeHtml(l.label || "")}
          </a>
        `
          )
          .join("")}
      </div>
    `;
      initExternalLinks(container);
    }
    const siteConfig = getSiteConfig();
    const links = siteConfig && Array.isArray(siteConfig.links) ? siteConfig.links : [];
    if (links.length > 0) {
      putLinks(links);
      return;
    }
    loadJsonManifest("assets/data/site-config.json")
      .then((config) => {
        if (config && Array.isArray(config.links) && config.links.length > 0) {
          setSiteConfig({ links: config.links });
          putLinks(config.links);
        } else {
          putLinks([]);
        }
      })
      .catch(() => putLinks([]));
  }

  function renderHeaderSocials() {
    const container = el.headerSocial;
    if (!container) return;
    const siteConfig = getSiteConfig();
    const links = siteConfig && Array.isArray(siteConfig.links) ? siteConfig.links : [];
    if (!links.length) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = links
      .map(
        (l) =>
          `<a href="${escapeHtml(l.href || "#")}" target="_blank" rel="noopener noreferrer" class="dx-icon-btn" aria-label="${escapeHtml(l.label || "Link")}">
            <span class="iconify" data-icon="${escapeHtml(l.icon || "mdi:link")}" aria-hidden="true"></span>
          </a>`
      )
      .join("");
  }

  function renderRotaDateTime(contentEl) {
    const rotaDateTimeEl = contentEl ? contentEl.querySelector("[data-dx-rota-datetime]") : null;
    if (!rotaDateTimeEl) return;
    function updateRotaClock() {
      rotaDateTimeEl.textContent = new Date().toLocaleString(undefined, { dateStyle: "full", timeStyle: "medium" });
    }
    updateRotaClock();
    const rotaClockInterval = setInterval(updateRotaClock, 1000);
    rotaDateTimeEl.dataset.dxRotaClockInterval = String(rotaClockInterval);
  }

  function renderStreamingRota(container) {
    fetch("assets/data/streaming-rota.json", { cache: "no-cache" })
      .then((res) => res.json())
      .then((rota) => {
        const next = getNextStreamFromRota(rota);
        if (next) {
          container.innerHTML = `<p><strong>${escapeHtml(next.label)}</strong> — ${escapeHtml(next.dateFormatted)} at ${escapeHtml(next.time || "—")}</p>`;
        } else {
          container.innerHTML = "<p class=\"dx-muted\">No upcoming stream in the next 14 days. Edit <code>assets/data/streaming-rota.json</code> to set your schedule.</p>";
        }
      })
      .catch(() => {
        container.innerHTML = "<p class=\"dx-muted\">Couldn't load schedule. Check <code>assets/data/streaming-rota.json</code>.</p>";
      });
  }

  function renderRotaWeek(container) {
    fetch("assets/data/streaming-rota.json", { cache: "no-cache" })
      .then((res) => res.json())
      .then((rota) => {
        const week = getRotaWeekEntries(rota);
        container.innerHTML = `
          <ul class="dx-rota-week-list">
            ${week.map((d) => `<li><strong>${escapeHtml(d.dateFormatted)}</strong>${d.label ? ` — ${escapeHtml(d.label)}${d.time ? ` at ${escapeHtml(d.time)}` : ""}` : " — No stream"}</li>`).join("")}
          </ul>
        `;
      })
      .catch(() => {
        container.innerHTML = "<p class=\"dx-muted\">Couldn't load schedule.</p>";
      });
  }

  function starsFromRating(rating) {
    const n = Math.min(5, Math.max(0, Number(rating) || 0));
    const full = Math.floor(n);
    const empty = 5 - full;
    return "★".repeat(full) + "☆".repeat(empty);
  }

  function formatGameDate(str) {
    if (!str) return "—";
    try {
      const d = new Date(str);
      return isNaN(d.getTime()) ? str : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return str;
    }
  }

  function getGameImageSrc(game, baseUrl) {
    if (game.imageUrl && String(game.imageUrl).trim().startsWith("http")) return game.imageUrl.trim();
    if (game.image && String(game.image).trim()) return baseUrl + "assets/images/games/" + game.image.replace(/^\/+/, "");
    return "";
  }

  function renderGamesInto(container) {
    if (!container) return;
    const base = getBaseUrlWithSlash();
    loadJsonManifest("assets/data/games.json")
      .then((data) => {
        const games = Array.isArray(data.games) ? data.games : [];
        if (!games.length) {
          container.innerHTML = "<p class=\"dx-muted\">No games listed yet.</p>";
          return;
        }
        container.innerHTML = games
          .map((g) => {
            const name = g.name || g.id || "—";
            const id = g.id || "";
            const href = "?page=game&id=" + encodeURIComponent(id);
            const imgSrc = getGameImageSrc(g, base);
            const imgHtml = imgSrc
              ? `<img src="${escapeHtml(imgSrc)}" alt="" class="dx-discover-card-image" loading="lazy" />`
              : `<div class="dx-discover-card-image-placeholder"><span>${escapeHtml(String(name).slice(0, 1))}</span></div>`;
            const ratingStr = starsFromRating(g.rating);
            return `<a href="${escapeHtml(href)}" class="dx-discover-card" data-dx-page="game" role="listitem">
              ${imgHtml}
              <div class="dx-discover-card-body">
                <h3 class="dx-discover-card-title">${escapeHtml(name)}</h3>
                <p class="dx-discover-card-desc dx-discover-card-rating" aria-label="Rating ${g.rating || 0} out of 5">${ratingStr}</p>
              </div>
            </a>`;
          })
          .join("");
      })
      .catch(() => {
        container.innerHTML = "<p class=\"dx-muted\">Couldn't load games.</p>";
      });
  }

  function renderGameDetailPage(container) {
    if (!container) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const titleEl = document.getElementById("dxGameTitle");
    const headerContainer = titleEl && titleEl.parentElement;
    const resetHeader = () => {
      if (headerContainer) headerContainer.innerHTML = "<h1 class=\"dx-heading-reset dx-game-page-title\" id=\"dxGameTitle\">Game</h1>";
    };
    if (!id || !id.trim()) {
      resetHeader();
      container.innerHTML = "<p class=\"dx-muted\">No game specified. <a class=\"dx-link\" href=\"?page=games\">Back to Games</a></p>";
      initExternalLinks(container);
      return;
    }
    const base = getBaseUrlWithSlash();
    loadJsonManifest("assets/data/games.json")
      .then((data) => {
        const games = Array.isArray(data.games) ? data.games : [];
        const game = games.find((g) => (g.id || "") === id.trim());
        if (!game) {
          resetHeader();
          container.innerHTML = "<p class=\"dx-muted\">Game not found. <a class=\"dx-link\" href=\"?page=games\">Back to Games</a></p>";
          initExternalLinks(container);
          return;
        }
        const name = game.name || game.id || "—";
        const links = Array.isArray(game.links) ? game.links : [];
        const linksHtml = links.length
          ? `<ul class="dx-game-links-list">${links.map((l) => {
              const url = l.url || "#";
              const isExternal = url.startsWith("http");
              return `<li><a class="dx-link" href="${escapeHtml(url)}" ${isExternal ? "target=\"_blank\" rel=\"noopener noreferrer\"" : ""}>${escapeHtml(l.label || url || "Link")}</a></li>`;
            }).join("")}</ul>`
          : "";
        const trailerHtml = game.youtubeVideoId
          ? `<div class="dx-game-video-wrap"><h3 class="dx-heading-reset dx-game-video-label">Trailer</h3><iframe class="dx-game-video" src="https://www.youtube.com/embed/${escapeHtml(game.youtubeVideoId)}" title="Trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
          : "";
        const tutorialHtml = game.tutorialYoutubeId
          ? `<div class="dx-game-video-wrap"><h3 class="dx-heading-reset dx-game-video-label">Tutorial</h3><iframe class="dx-game-video" src="https://www.youtube.com/embed/${escapeHtml(game.tutorialYoutubeId)}" title="Tutorial" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
          : "";
        const coverImgSrc = getGameImageSrc(game, base);
        const coverHtml = coverImgSrc
          ? `<img src="${escapeHtml(coverImgSrc)}" alt="" class="dx-game-cover-img" loading="lazy" />`
          : "";
        const rotaHtml = game.rotaDay
          ? `<p class="dx-game-rota dx-muted">On my schedule: <a class="dx-link" href="?page=streaming-rota">${escapeHtml(game.rotaDay)}</a></p>`
          : "";
        const meta = [game.platform, game.genre, game.status].filter(Boolean).join(" · ");
        const reviewText = (game.review || game.description || "").trim();
        const reviewHtml = reviewText
          ? `<h3 class="dx-heading-reset dx-game-review-title">My review</h3><div class="dx-game-review">${escapeHtml(reviewText).replace(/\n/g, "<br />")}</div>`
          : "";
        if (headerContainer) {
          headerContainer.innerHTML = `<div class="dx-game-detail-header"><h1 class="dx-heading-reset dx-game-detail-title">${escapeHtml(name)}</h1>${coverHtml ? `<div class="dx-game-cover">${coverHtml}</div>` : ""}</div>`;
        }
        container.innerHTML = `
          <p><a class="dx-btn dx-game-back" href="?page=games">← Back to Games</a></p>
          ${meta ? `<p class="dx-game-meta dx-muted">${escapeHtml(meta)}</p>` : ""}
          <div class="dx-game-rating" aria-label="Rating ${game.rating || 0} out of 5">${starsFromRating(game.rating)}</div>
          <p class="dx-game-dates dx-muted">Started ${formatGameDate(game.dateStarted)}${game.dateCompleted ? ` · Completed ${formatGameDate(game.dateCompleted)}` : " · Still playing"}</p>
          ${rotaHtml}
          ${trailerHtml}
          ${tutorialHtml}
          ${reviewHtml}
          ${links.length ? `<h3 class="dx-heading-reset dx-game-links-title">Links</h3>${linksHtml}` : ""}
        `;
        initExternalLinks(container);
      })
      .catch(() => {
        resetHeader();
        container.innerHTML = "<p class=\"dx-muted\">Couldn't load game. <a class=\"dx-link\" href=\"?page=games\">Back to Games</a></p>";
        initExternalLinks(container);
      });
  }

  return {
    initTabs,
    loadCommandsCatalog,
    loadMentions,
    badgeForPermission,
    renderCommandsCatalogInto,
    renderMentionsInto,
    renderOverlaysInto,
    renderInventoryInto,
    renderWidgetsInto,
    renderOverlayUrlBox,
    renderImportBox,
    renderActionImportsInto,
    renderTouchPortalTabs,
    renderRelatedInto,
    renderDynamicLinks,
    renderHeaderSocials,
    renderRotaDateTime,
    renderStreamingRota,
    renderRotaWeek,
    renderEmotesInto,
    renderGamesInto,
    renderGameDetailPage,
  };
}
