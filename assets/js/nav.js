/* DexNeXuS — Streaming Lab — navigation, search, discover grid
   Receives api from app; returns setNavOpen, updateNavActive, renderNav, renderNavDesktop,
   closeAllDesktopDropdowns, renderSearchResults, setSearchOverlayOpen, getSearchFilter, refreshDiscoverGrid. */

import {
  escapeHtml,
  normalize,
  byOrderThenTitle,
  groupRank,
  normalizeWidget,
} from "./utils.js";

/**
 * @param {{
 *   getManifest: () => { pages: Array<{ slug: string, title: string, description?: string, group?: string, order?: number, tags?: string[], contentFile: string, hideFromNav?: boolean, cardImage?: string }> },
 *   getNavConfig: () => { groups: Array<{ label: string, items: Array<{ slug?: string, label?: string, items?: Array<{ slug?: string }> }> }> } | null,
 *   el: { navToggle: HTMLElement | null, navPanel: HTMLElement | null, navGroups: HTMLElement | null, navDesktop: HTMLElement | null, search: HTMLInputElement | null, searchOverlay: HTMLElement | null, searchTrigger: HTMLElement | null, searchClose: HTMLElement | null, searchOverlayInput: HTMLInputElement | null, searchResults: HTMLElement | null, content: HTMLElement | null },
 *   navigateTo: (slug: string, replace?: boolean) => Promise<void>,
 *   getPageBySlug: (slug: string) => { slug: string, title: string, tags?: string[], group?: string, description?: string, order?: number } | null,
 *   getRouteSlug: () => string,
 *   getBaseUrlWithSlash: () => string,
 *   resolveImagePath: (ref: string, base?: string) => string,
 *   resolvePageCardImage: (page: { slug: string, cardImage?: string }, base?: string) => string | null,
 *   loadJsonManifest: (path: string) => Promise<unknown>,
 * }} api
 * @returns {{ setNavOpen: (open: boolean) => void, updateNavActive: (slug: string) => void, renderNav: (filterText?: string) => void, renderNavDesktop: () => void, closeAllDesktopDropdowns: () => void, renderSearchResults: (filterText: string) => void, setSearchOverlayOpen: (open: boolean) => void, getSearchFilter: () => string, refreshDiscoverGrid: () => void }}
 */
export function createNav(api) {
  const { getManifest, getNavConfig, el, getPageBySlug, getRouteSlug, getBaseUrlWithSlash, resolveImagePath, resolvePageCardImage, loadJsonManifest } = api;
  const navigateTo = (slug, replace) => api.navigateTo(slug, replace);

  function groupPages(pages) {
    const groups = {};
    for (const p of pages) {
      const g = p.group?.trim() || "Pages";
      (groups[g] ||= []).push(p);
    }
    for (const g of Object.keys(groups)) {
      groups[g].sort(byOrderThenTitle);
    }
    return groups;
  }

  function resolveNavItem(item) {
    if (!item) return null;
    if (item.slug) {
      const page = getPageBySlug(item.slug);
      if (page && page.hideFromNav) return null;
      return page ? { type: "page", page } : null;
    }
    if (item.label && Array.isArray(item.items) && item.items.length > 0) {
      const resolved = item.items.map(resolveNavItem).filter(Boolean);
      if (resolved.length === 0) return null;
      return { type: "submenu", label: item.label, items: resolved };
    }
    return null;
  }

  function pageMatchesFilter(page, q) {
    if (!q) return true;
    const hay = `${page.title} ${page.group || ""} ${(page.tags || []).join(" ")} ${page.description || ""}`;
    return normalize(hay).includes(q);
  }

  function filterResolvedNavItem(r, q) {
    if (!q) return r;
    if (r.type === "page") return pageMatchesFilter(r.page, q) ? r : null;
    if (r.type === "submenu") {
      const filtered = r.items.map((i) => filterResolvedNavItem(i, q)).filter(Boolean);
      return filtered.length ? { ...r, items: filtered } : null;
    }
    return null;
  }

  function getPagesAndGroups(filterText) {
    const manifest = getManifest();
    const q = normalize(filterText);
    const pages = manifest.pages
      .filter((p) => !p.hideFromNav)
      .slice()
      .sort(byOrderThenTitle)
      .filter((p) => {
        if (!q) return true;
        const hay = `${p.title} ${p.group || ""} ${(p.tags || []).join(" ")} ${p.description || ""}`;
        return normalize(hay).includes(q);
      });
    const homePage = pages.find((p) => p.slug === "home") || null;
    const pagesWithoutHome = homePage ? pages.filter((p) => p.slug !== "home") : pages;
    const groups = groupPages(pagesWithoutHome);
    const groupNames = Object.keys(groups).sort((a, b) => {
      const ra = groupRank(a);
      const rb = groupRank(b);
      if (ra !== rb) return ra - rb;
      return a.localeCompare(b);
    });
    return { homePage, groups, groupNames };
  }

  function setNavOpen(open) {
    if (!el.navPanel || !el.navToggle) return;
    el.navPanel.dataset.open = open ? "true" : "false";
    el.navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function updateNavActive(slug) {
    const links = document.querySelectorAll("[data-dx-page]");
    links.forEach((a) => {
      const isActive = a.getAttribute("data-dx-page") === slug;
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function appendPageLink(container, page, filterText) {
    if (filterText && !pageMatchesFilter(page, normalize(filterText))) return;
    const a = document.createElement("a");
    a.href = `?page=${encodeURIComponent(page.slug)}`;
    a.className = "dx-nav-link";
    a.setAttribute("data-dx-page", page.slug);
    const tags = (page.tags || []).slice(0, 3);
    const tagText = tags.length ? tags.join(" • ") : "";
    a.innerHTML = `<div class="dx-nav-link-title"></div><div class="dx-nav-link-tags"></div>`;
    const linkTitle = a.querySelector(".dx-nav-link-title");
    const linkTags = a.querySelector(".dx-nav-link-tags");
    if (linkTitle) linkTitle.textContent = page.title;
    if (linkTags) linkTags.textContent = tagText;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(page.slug);
      setNavOpen(false);
    });
    container.appendChild(a);
  }

  function renderNav(filterText = "") {
    if (!el.navGroups) return;
    el.navGroups.innerHTML = "";
    const q = normalize(filterText);
    const navConfig = getNavConfig();
    const manifest = getManifest();

    const homePage = getPageBySlug("home");
    if (homePage && !homePage.hideFromNav && (!q || pageMatchesFilter(homePage, q))) {
      const homeWrap = document.createElement("div");
      homeWrap.className = "dx-nav-group";
      homeWrap.dataset.open = "true";
      const header = document.createElement("div");
      header.className = "dx-nav-group-header";
      header.innerHTML = `<div><div class="dx-nav-group-title"></div><div class="dx-nav-group-meta"></div></div>`;
      const headerTitle = header.querySelector(".dx-nav-group-title");
      const headerMeta = header.querySelector(".dx-nav-group-meta");
      if (headerTitle) headerTitle.textContent = "Home";
      if (headerMeta) headerMeta.textContent = "Start here";
      const linksWrap = document.createElement("div");
      linksWrap.className = "dx-nav-links";
      appendPageLink(linksWrap, homePage);
      homeWrap.appendChild(header);
      homeWrap.appendChild(linksWrap);
      el.navGroups.appendChild(homeWrap);
    }

    if (navConfig && Array.isArray(navConfig.groups)) {
      for (const group of navConfig.groups) {
        const resolved = (group.items || [])
          .map(resolveNavItem)
          .filter(Boolean)
          .map((r) => filterResolvedNavItem(r, q))
          .filter(Boolean);
        if (resolved.length === 0) continue;
        const countPages = (r) => {
          if (r.type === "page") return 1;
          if (r.type === "submenu") return r.items.reduce((n, i) => n + countPages(i), 0);
          return 0;
        };
        const totalPages = resolved.reduce((n, r) => n + countPages(r), 0);
        const groupEl = document.createElement("div");
        groupEl.className = "dx-nav-group";
        groupEl.dataset.open = "true";
        const header = document.createElement("div");
        header.className = "dx-nav-group-header";
        header.innerHTML = `<div><div class="dx-nav-group-title"></div><div class="dx-nav-group-meta"></div></div>`;
        const headerTitle = header.querySelector(".dx-nav-group-title");
        const headerMeta = header.querySelector(".dx-nav-group-meta");
        if (headerTitle) headerTitle.textContent = group.label;
        if (headerMeta) headerMeta.textContent = `${totalPages} page${totalPages === 1 ? "" : "s"}`;
        header.addEventListener("click", () => {
          groupEl.dataset.open = groupEl.dataset.open === "true" ? "false" : "true";
        });
        const linksWrap = document.createElement("div");
        linksWrap.className = "dx-nav-links";
        for (const r of resolved) {
          if (r.type === "page") appendPageLink(linksWrap, r.page);
          else if (r.type === "submenu") {
            const subGroup = document.createElement("div");
            subGroup.className = "dx-nav-group dx-nav-sub-group";
            subGroup.dataset.open = "true";
            const subHeader = document.createElement("div");
            subHeader.className = "dx-nav-group-header dx-nav-sub-header";
            subHeader.innerHTML = `<div><div class="dx-nav-group-title"></div></div>`;
            const subTitle = subHeader.querySelector(".dx-nav-group-title");
            if (subTitle) subTitle.textContent = r.label;
            subHeader.addEventListener("click", (e) => {
              e.stopPropagation();
              subGroup.dataset.open = subGroup.dataset.open === "true" ? "false" : "true";
            });
            const subLinks = document.createElement("div");
            subLinks.className = "dx-nav-links";
            for (const sub of r.items) {
              if (sub.type === "page") appendPageLink(subLinks, sub.page);
            }
            subGroup.appendChild(subHeader);
            subGroup.appendChild(subLinks);
            linksWrap.appendChild(subGroup);
          }
        }
        groupEl.appendChild(header);
        groupEl.appendChild(linksWrap);
        el.navGroups.appendChild(groupEl);
      }
    } else {
      const { groups, groupNames } = getPagesAndGroups(filterText);
      for (const groupName of groupNames) {
        const groupPagesList = groups[groupName] || [];
        const groupEl = document.createElement("div");
        groupEl.className = "dx-nav-group";
        groupEl.dataset.open = "true";
        const header = document.createElement("div");
        header.className = "dx-nav-group-header";
        header.innerHTML = `<div><div class="dx-nav-group-title"></div><div class="dx-nav-group-meta"></div></div>`;
        const headerTitle = header.querySelector(".dx-nav-group-title");
        const headerMeta = header.querySelector(".dx-nav-group-meta");
        if (headerTitle) headerTitle.textContent = groupName;
        if (headerMeta) headerMeta.textContent = `${groupPagesList.length} page${groupPagesList.length === 1 ? "" : "s"}`;
        header.addEventListener("click", () => {
          groupEl.dataset.open = groupEl.dataset.open === "true" ? "false" : "true";
        });
        const linksWrap = document.createElement("div");
        linksWrap.className = "dx-nav-links";
        for (const p of groupPagesList) appendPageLink(linksWrap, p);
        groupEl.appendChild(header);
        groupEl.appendChild(linksWrap);
        el.navGroups.appendChild(groupEl);
      }
    }
  }

  function renderNavDesktop() {
    if (!el.navDesktop) return;
    el.navDesktop.innerHTML = "";
    const navConfig = getNavConfig();
    const manifest = getManifest();

    const homePage = getPageBySlug("home");
    if (homePage && !homePage.hideFromNav) {
      const homeLink = document.createElement("a");
      homeLink.href = "?page=home";
      homeLink.className = "dx-nav-desktop-home";
      homeLink.setAttribute("data-dx-page", "home");
      homeLink.textContent = "Home";
      homeLink.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo("home");
        closeAllDesktopDropdowns();
      });
      el.navDesktop.appendChild(homeLink);
    }

    if (navConfig && Array.isArray(navConfig.groups)) {
      for (const group of navConfig.groups) {
        const resolved = (group.items || []).map(resolveNavItem).filter(Boolean);
        if (resolved.length === 0) continue;
        const groupId = group.label.replace(/\s+/g, "-");
        const item = document.createElement("div");
        item.className = "dx-nav-desktop-item";
        item.dataset.open = "false";
        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "dx-nav-dd-trigger";
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute("aria-haspopup", "true");
        trigger.setAttribute("aria-controls", `dx-dd-${groupId}`);
        trigger.innerHTML = `${escapeHtml(group.label)} <span class="dx-nav-dd-arrow" aria-hidden="true">▼</span>`;
        const menu = document.createElement("div");
        menu.id = `dx-dd-${groupId}`;
        menu.className = "dx-nav-dd-menu";
        menu.setAttribute("role", "menu");
        for (const r of resolved) {
          if (r.type === "page") {
            const a = document.createElement("a");
            a.href = `?page=${encodeURIComponent(r.page.slug)}`;
            a.className = "dx-nav-dd-link";
            a.setAttribute("data-dx-page", r.page.slug);
            a.setAttribute("role", "menuitem");
            a.textContent = r.page.title;
            a.addEventListener("click", (e) => {
              e.preventDefault();
              navigateTo(r.page.slug);
              closeAllDesktopDropdowns();
            });
            menu.appendChild(a);
          } else if (r.type === "submenu") {
            const subWrap = document.createElement("div");
            subWrap.className = "dx-nav-dd-sub";
            subWrap.dataset.open = "false";
            const subTrigger = document.createElement("span");
            subTrigger.className = "dx-nav-dd-sub-trigger";
            subTrigger.setAttribute("role", "menuitem");
            subTrigger.innerHTML = `${escapeHtml(r.label)} <span class="dx-nav-dd-arrow dx-nav-dd-sub-arrow" aria-hidden="true">▶</span>`;
            const subMenu = document.createElement("div");
            subMenu.className = "dx-nav-dd-sub-menu";
            subMenu.setAttribute("role", "menu");
            for (const sub of r.items) {
              if (sub.type !== "page") continue;
              const a = document.createElement("a");
              a.href = `?page=${encodeURIComponent(sub.page.slug)}`;
              a.className = "dx-nav-dd-link";
              a.setAttribute("data-dx-page", sub.page.slug);
              a.setAttribute("role", "menuitem");
              a.textContent = sub.page.title;
              a.addEventListener("click", (e) => {
                e.preventDefault();
                navigateTo(sub.page.slug);
                closeAllDesktopDropdowns();
              });
              subMenu.appendChild(a);
            }
            subTrigger.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              subWrap.closest(".dx-nav-desktop-item")?.querySelectorAll(".dx-nav-dd-sub").forEach((s) => { s.dataset.open = "false"; });
              subWrap.dataset.open = subWrap.dataset.open === "true" ? "false" : "true";
            });
            subTrigger.addEventListener("mouseenter", () => {
              subWrap.closest(".dx-nav-desktop-item")?.querySelectorAll(".dx-nav-dd-sub").forEach((s) => {
                if (s !== subWrap) s.dataset.open = "false";
              });
              subWrap.dataset.open = "true";
            });
            subWrap.appendChild(subTrigger);
            subWrap.appendChild(subMenu);
            menu.appendChild(subWrap);
          }
        }
        trigger.addEventListener("click", (e) => {
          e.stopPropagation();
          closeAllDesktopDropdowns();
          if (item.dataset.open !== "true") {
            item.dataset.open = "true";
            trigger.setAttribute("aria-expanded", "true");
          }
        });
        item.appendChild(trigger);
        item.appendChild(menu);
        el.navDesktop.appendChild(item);
      }
    } else {
      const { groups, groupNames } = getPagesAndGroups("");
      for (const groupName of groupNames) {
        if (groupName === "Start Here") continue;
        const groupPagesList = groups[groupName] || [];
        const item = document.createElement("div");
        item.className = "dx-nav-desktop-item";
        item.dataset.open = "false";
        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "dx-nav-dd-trigger";
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute("aria-haspopup", "true");
        trigger.setAttribute("aria-controls", `dx-dd-${groupName.replace(/\s+/g, "-")}`);
        trigger.innerHTML = `${escapeHtml(groupName)} <span class="dx-nav-dd-arrow" aria-hidden="true">▼</span>`;
        const menu = document.createElement("div");
        menu.id = `dx-dd-${groupName.replace(/\s+/g, "-")}`;
        menu.className = "dx-nav-dd-menu";
        menu.setAttribute("role", "menu");
        for (const p of groupPagesList) {
          const a = document.createElement("a");
          a.href = `?page=${encodeURIComponent(p.slug)}`;
          a.className = "dx-nav-dd-link";
          a.setAttribute("data-dx-page", p.slug);
          a.setAttribute("role", "menuitem");
          a.textContent = p.title;
          a.addEventListener("click", (e) => {
            e.preventDefault();
            navigateTo(p.slug);
            closeAllDesktopDropdowns();
          });
          menu.appendChild(a);
        }
        trigger.addEventListener("click", (e) => {
          e.stopPropagation();
          closeAllDesktopDropdowns();
          if (item.dataset.open !== "true") {
            item.dataset.open = "true";
            trigger.setAttribute("aria-expanded", "true");
          }
        });
        item.appendChild(trigger);
        item.appendChild(menu);
        el.navDesktop.appendChild(item);
      }
    }
  }

  function closeAllDesktopDropdowns() {
    document.querySelectorAll(".dx-nav-desktop-item[data-open='true']").forEach((item) => {
      item.dataset.open = "false";
      const btn = item.querySelector(".dx-nav-dd-trigger");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".dx-nav-dd-sub[data-open='true']").forEach((sub) => { sub.dataset.open = "false"; });
  }

  function getSearchFilter() {
    return (el.searchOverlayInput?.value || el.search?.value || "").trim();
  }

  function renderDiscoverGrid(container, filterText) {
    const manifest = getManifest();
    if (!container || !manifest.pages) return;
    const q = normalize(filterText);
    const base = getBaseUrlWithSlash();

    function toPageItem(p) {
      return {
        slug: p.slug,
        title: p.title,
        description: p.description || "",
        group: p.group || "",
        cardImage: resolvePageCardImage ? resolvePageCardImage(p, base) : (p.cardImage ? resolveImagePath(p.cardImage, base) : null),
        hash: null,
        order: p.order ?? 999,
      };
    }
    function toWidgetItem(w) {
      return {
        slug: "html-widgets",
        hash: w.id,
        title: w.name || w.id || "Widget",
        description: w.description || "",
        group: "Widget",
        cardImage: w.image ? resolveImagePath(w.image, base) : null,
        order: w.discoverOrder ?? 50,
      };
    }

    function renderItems(items) {
      container.innerHTML = items
        .map((item) => {
          const img = item.cardImage
            ? `<img class="dx-discover-card-image" src="${escapeHtml(item.cardImage)}" alt="" loading="lazy" />`
            : `<div class="dx-discover-card-image-placeholder"><span>${escapeHtml(item.group || "Resource")}</span></div>`;
          const desc = escapeHtml((item.description || "").slice(0, 120));
          const href = item.hash ? `?page=${encodeURIComponent(item.slug)}#${encodeURIComponent(item.hash)}` : `?page=${encodeURIComponent(item.slug)}`;
          return `<a class="dx-discover-card" href="${href}" data-dx-page="${escapeHtml(item.slug)}" ${item.hash ? `data-dx-hash="${escapeHtml(item.hash)}"` : ""} role="listitem">${img}<div class="dx-discover-card-body"><h3 class="dx-discover-card-title">${escapeHtml(item.title)}</h3><p class="dx-discover-card-desc">${desc || "—"}</p></div></a>`;
        })
        .join("");
      container.querySelectorAll(".dx-discover-card").forEach((a) => {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          const slug = a.getAttribute("data-dx-page");
          const hash = a.getAttribute("data-dx-hash");
          if (slug) navigateTo(slug, false);
          if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 100);
        });
      });
    }

    const allPages = manifest.pages.filter((p) => !p.hideFromNav && p.slug !== "home");
    const pageMap = new Map(allPages.map((p) => [p.slug, p]));
    Promise.all([
      loadJsonManifest("assets/data/discover.json").catch(() => ({ items: [] })),
      loadJsonManifest("assets/data/widgets.json").catch(() => ({ widgets: [] })),
    ]).then(([discoverData, widgetsData]) => {
      const discoverItems = discoverData.items || [];
      const widgets = (widgetsData.widgets || []).map(normalizeWidget);
      const widgetMap = new Map(widgets.map((w) => [w.id, w]));
      let items;
      if (discoverItems.length > 0) {
        items = discoverItems
          .map((id) => {
            const w = widgetMap.get(id);
            if (w) return toWidgetItem(w);
            const p = pageMap.get(id);
            if (p) return toPageItem(p);
            return null;
          })
          .filter(Boolean);
      } else {
        const pageItems = allPages.map(toPageItem);
        const widgetItems = widgets.filter((w) => w.showOnDiscover).map(toWidgetItem);
        items = [...pageItems, ...widgetItems].sort((a, b) => (a.order - b.order) || (a.title.localeCompare(b.title)));
      }
      const filtered = q ? items.filter((i) => normalize(`${i.title} ${i.group} ${i.description}`).includes(q)) : items;
      renderItems(filtered);
    });
  }

  function refreshDiscoverGrid() {
    if (getRouteSlug() !== "home") return;
    const container = el.content?.querySelector("[data-dx-discover]");
    if (container) renderDiscoverGrid(container, getSearchFilter());
  }

  function renderSearchResults(filterText) {
    if (!el.searchResults) return;
    const q = normalize(filterText);
    if (!q) {
      el.searchResults.innerHTML = "";
      return;
    }
    const manifest = getManifest();
    const pages = manifest.pages
      .filter((p) => !p.hideFromNav)
      .filter((p) => {
        const hay = `${p.title} ${p.group || ""} ${(p.tags || []).join(" ")} ${p.description || ""}`;
        return normalize(hay).includes(q);
      });
    el.searchResults.innerHTML = pages
      .map((p) => `<a class="dx-search-result-link" href="?page=${encodeURIComponent(p.slug)}" data-dx-page="${escapeHtml(p.slug)}" role="listitem">${escapeHtml(p.title)}<small>${escapeHtml(p.group || "")}</small></a>`)
      .join("");
    el.searchResults.querySelectorAll(".dx-search-result-link").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const slug = a.getAttribute("data-dx-page");
        if (slug) {
          navigateTo(slug);
          setSearchOverlayOpen(false);
        }
      });
    });
  }

  function setSearchOverlayOpen(open) {
    if (!el.searchOverlay || !el.searchTrigger) return;
    el.searchOverlay.hidden = !open;
    el.searchOverlay.setAttribute("aria-hidden", open ? "false" : "true");
    el.searchTrigger.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      el.searchOverlayInput?.focus();
      renderSearchResults(el.searchOverlayInput?.value || "");
    } else {
      if (el.searchOverlayInput) el.searchOverlayInput.value = "";
      if (el.searchResults) el.searchResults.innerHTML = "";
    }
    refreshDiscoverGrid();
  }

  return {
    setNavOpen,
    updateNavActive,
    renderNav,
    renderNavDesktop,
    closeAllDesktopDropdowns,
    renderSearchResults,
    setSearchOverlayOpen,
    getSearchFilter,
    refreshDiscoverGrid,
  };
}
