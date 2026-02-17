/* DexNeXuS — Streaming Lab (no-framework SPA)
   - Loads a pages manifest (assets/data/pages.json)
   - Builds nav automatically
   - Loads HTML fragments from /content
   - Provides copy-to-clipboard + toast helpers */

import {
  loadJsonManifest,
  escapeHtml,
  normalize,
  byOrderThenTitle,
  GROUP_ORDER,
  groupRank,
  dateToKey,
  getStreamForDate,
  getNextStreamFromRota,
  getRotaWeekEntries,
  normalizeWidget,
} from "./utils.js";
import { loadSiteData } from "./data.js";
import { createNav } from "./nav.js";
import { createMusic } from "./music.js";
import { createContent } from "./content.js";
import { createUI } from "./ui.js";

(() => {
  /** @type {{pages: Array<{slug: string, title: string, description?: string, group?: string, order?: number, tags?: string[], contentFile: string}>}} */
  let manifest = { pages: [] };

  /** @type {{ baseUrl?: string, links?: Array<{ label: string, href: string, icon?: string }> } | null} */
  let siteConfig = null;

  /** @type {Record<string, string>|null} */
  let imageMap = null;

  /** @type {{ groups: Array<{ label: string, items: Array<{ slug?: string, label?: string, items?: Array<{ slug?: string }> }> }> }|null} */
  let navConfig = null;

  const contentCache = new Map();

  function resolveImagePath(ref, base) {
    if (!ref || !String(ref).trim()) return "";
    const r = String(ref).trim();
    if (r.startsWith("http")) return r;
    const baseUrl = base || getBaseUrlWithSlash();
    const filename = r.includes("/") ? r.replace(/^.*\//, "") : r;
    const mapped = imageMap && imageMap[filename];
    const path = mapped || r;
    return path.startsWith("http") ? path : baseUrl + path.replace(/^\//, "");
  }

  /** Resolve card image for a page: use cardImage if set, else try imageMap[slug + '.png']. */
  function resolvePageCardImage(page, base) {
    if (!page) return null;
    const baseUrl = base || getBaseUrlWithSlash();
    if (page.cardImage) {
      const url = resolveImagePath(page.cardImage, baseUrl);
      return url || null;
    }
    const slugKey = page.slug + ".png";
    if (imageMap && imageMap[slugKey]) return baseUrl + imageMap[slugKey].replace(/^\//, "");
    return null;
  }

  /** Simple markdown to HTML for viewer (headings, paragraphs, lists, code, links, bold/italic). */
  function mdToHtml(md) {
    if (!md || typeof md !== "string") return "";
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    const out = [];
    let inCode = false;
    let codeBuf = [];
    let inList = false;
    let listTag = "ul";
    let inTable = false;

    function flushTable() {
      if (inTable) {
        out.push("</tbody></table>");
        inTable = false;
      }
    }

    function flushCode() {
      if (codeBuf.length) {
        out.push("<pre class=\"dx-viewer-code\"><code>", escapeHtml(codeBuf.join("\n")), "</code></pre>");
        codeBuf = [];
      }
      inCode = false;
    }
    function flushList() {
      if (inList) {
        out.push("</", listTag, ">");
        inList = false;
      }
    }
    function flushParagraph(p) {
      if (!p.trim()) return;
      let s = escapeHtml(p);
      s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
      s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
      s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a class=\"dx-link\" href=\"$2\" target=\"_blank\" rel=\"noopener noreferrer\">$1</a>");
      out.push("<p>", s, "</p>");
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("```")) {
        flushList();
        flushTable();
        if (inCode) {
          flushCode();
        } else {
          inCode = true;
        }
        continue;
      }
      if (inCode) {
        codeBuf.push(line);
        continue;
      }
      if (line.startsWith("# ")) {
        flushList();
        flushTable();
        out.push("<h2 class=\"dx-viewer-h2\">", escapeHtml(line.slice(2)), "</h2>");
        continue;
      }
      if (line.startsWith("## ")) {
        flushList();
        flushTable();
        out.push("<h3 class=\"dx-viewer-h3\">", escapeHtml(line.slice(3)), "</h3>");
        continue;
      }
      if (line.startsWith("### ")) {
        flushList();
        flushTable();
        out.push("<h4 class=\"dx-viewer-h4\">", escapeHtml(line.slice(4)), "</h4>");
        continue;
      }
      if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
        const isOl = /^\d+\. /.test(line);
        if (!inList || (isOl && listTag === "ul") || (!isOl && listTag === "ol")) {
          flushList();
          listTag = isOl ? "ol" : "ul";
          out.push("<", listTag, " class=\"dx-viewer-list\">");
          inList = true;
        }
        const content = line.replace(/^[-*]\s/, "").replace(/^\d+\.\s/, "");
        let s = escapeHtml(content);
        s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
        s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
        s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a class=\"dx-link\" href=\"$2\" target=\"_blank\" rel=\"noopener noreferrer\">$1</a>");
        out.push("<li>", s, "</li>");
        continue;
      }
      if (line.startsWith("|") && line.includes("|")) {
        flushList();
        const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
        const isSep = cells.every((c) => /^:?-+:?$/.test(c));
        if (isSep) continue;
        if (!inTable) {
          out.push("<table class=\"dx-viewer-table\"><tbody>");
          inTable = true;
        }
        out.push("<tr>");
        cells.forEach((cell) => {
          out.push("<td>", escapeHtml(cell), "</td>");
        });
        out.push("</tr>");
        continue;
      }
      flushList();
      flushTable();
      if (line.trim() === "") continue;
      flushParagraph(line);
    }
    flushCode();
    flushList();
    flushTable();
    return out.join("");
  }

  async function initViewer(container) {
    const titleEl = document.getElementById("dxViewerTitle");
    const contentEl = document.getElementById("dxViewerContent");
    if (!contentEl) return;
    const params = new URLSearchParams(window.location.search);
    const path = params.get("path");
    if (!path || !path.trim()) {
      if (titleEl) titleEl.textContent = "Guide";
      contentEl.innerHTML = "<p class=\"dx-muted\">No document specified. Use <code>?page=viewer&path=widgets/howto/example.md</code></p>";
      return;
    }
    const base = getBaseUrlWithSlash();
    const url = base + path.replace(/^\//, "");
    if (titleEl) {
      const name = path.replace(/^.*\//, "").replace(/\.[^.]+$/, "");
      titleEl.textContent = name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) {
        contentEl.innerHTML = "<p class=\"dx-muted\">Guide not found or could not be loaded.</p>";
        return;
      }
      const text = await res.text();
      const ext = (path.split(".").pop() || "").toLowerCase();
      if (ext === "md" || ext === "markdown") {
        contentEl.innerHTML = "<div class=\"dx-viewer-prose\">" + mdToHtml(text) + "</div>";
      } else {
        contentEl.innerHTML = "<pre class=\"dx-viewer-pre\">" + escapeHtml(text) + "</pre>";
      }
    } catch {
      contentEl.innerHTML = "<p class=\"dx-muted\">Could not load the document.</p>";
    }
  }

  function getBaseUrl() {
    const basePath = window.location.pathname.replace(/[^/]*$/, "") || "/";
    const fallback = window.location.origin + (basePath === "/" ? "" : basePath);
    if (siteConfig && typeof siteConfig.baseUrl === "string" && siteConfig.baseUrl.trim() !== "")
      return siteConfig.baseUrl.trim().replace(/\/$/, "");
    return fallback;
  }

  function getBaseUrlWithSlash() {
    const base = getBaseUrl();
    return base.endsWith("/") ? base : base + "/";
  }

  const el = {
    navToggle: /** @type {HTMLButtonElement|null} */ (document.querySelector(".dx-nav-toggle")),
    navPanel: /** @type {HTMLDivElement|null} */ (document.querySelector("#dxNavPanel")),
    navGroups: /** @type {HTMLDivElement|null} */ (document.querySelector("#dxNavGroups")),
    navDesktop: /** @type {HTMLElement|null} */ (document.querySelector("#dxNavDesktop")),
    search: /** @type {HTMLInputElement|null} */ (document.querySelector("#dxSearch")),
    searchOverlay: /** @type {HTMLElement|null} */ (document.querySelector("#dxSearchOverlay")),
    searchTrigger: /** @type {HTMLButtonElement|null} */ (document.querySelector(".dx-search-trigger")),
    searchClose: /** @type {HTMLButtonElement|null} */ (document.querySelector(".dx-search-close")),
    searchOverlayInput: /** @type {HTMLInputElement|null} */ (document.querySelector("#dxSearchOverlayInput")),
    searchResults: /** @type {HTMLElement|null} */ (document.querySelector("#dxSearchResults")),
    content: /** @type {HTMLElement|null} */ (document.querySelector("#dxContent")),
    loading: /** @type {HTMLElement|null} */ (document.querySelector("#dxLoading")),
    toastHost: /** @type {HTMLElement|null} */ (document.querySelector("#dxToastHost")),
    copyPageLink: /** @type {HTMLAnchorElement|null} */ (document.querySelector("#dxCopyPageLink")),
    headerSocial: /** @type {HTMLElement|null} */ (document.querySelector("#dxHeaderSocial")),
    brand: /** @type {HTMLAnchorElement|null} */ (document.querySelector(".dx-brand")),
  };

  const ui = createUI({ loading: el.loading, toastHost: el.toastHost });

  function getRouteSlug() {
    const url = new URL(window.location.href);
    const fromQuery = url.searchParams.get("page");
    if (fromQuery) return fromQuery;
    const hash = window.location.hash.replace(/^#/, "");
    return hash || "home";
  }

  function setRouteSlug(slug, replace = false) {
    const current = new URL(window.location.href);
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("page", slug);
    if (slug === "viewer") {
      const path = current.searchParams.get("path");
      if (path) url.searchParams.set("path", path);
    } else if (slug === "game") {
      const id = current.searchParams.get("id");
      if (id) url.searchParams.set("id", id);
    }
    url.hash = "";
    if (replace) {
      window.history.replaceState({ page: slug }, "", url.toString());
    } else {
      window.history.pushState({ page: slug }, "", url.toString());
    }
  }

  function getPageBySlug(slug) {
    return manifest.pages.find((p) => p.slug === slug) || null;
  }

  function updateOpenGraph(page) {
    const titleEl = document.getElementById("dxOgTitle");
    const descEl = document.getElementById("dxOgDescription");
    const imgEl = document.getElementById("dxOgImage");
    const siteTitle = "DexNeXuS — Streaming Lab";
    const siteDesc = "Streaming setup ideas, Streamer.bot actions, OBS resources, Touch Portal stuff, and tutorials.";
    if (!page || page.slug === "home") {
      if (titleEl) titleEl.setAttribute("content", siteTitle);
      if (descEl) descEl.setAttribute("content", siteDesc);
      if (imgEl) imgEl.setAttribute("content", "");
      return;
    }
    if (titleEl) titleEl.setAttribute("content", `${page.title} — DexNeXuS`);
    if (descEl) descEl.setAttribute("content", page.description || siteDesc);
    if (imgEl) {
      const base = getBaseUrlWithSlash();
      const imgUrl = page.cardImage ? resolveImagePath(page.cardImage, base) : "";
      imgEl.setAttribute("content", imgUrl);
    }
  }

  function postProcessContent() {
    if (!el.content) return;
    ui.initCopyButtons(el.content);
    ui.initExternalLinks(el.content);
    content.initTabs(el.content);
    el.content.querySelectorAll("img[data-dx-image]").forEach((img) => {
      const name = img.getAttribute("data-dx-image");
      if (name) img.src = resolveImagePath(name);
    });
    el.content.querySelectorAll('img[src*="assets/images"]').forEach((img) => {
      const src = img.getAttribute("src");
      if (src && !src.startsWith("http")) {
        const filename = src.replace(/^.*\//, "");
        const resolved = resolveImagePath(filename);
        if (resolved) img.src = resolved;
      }
    });

    // SPA: intercept in-content links that point to ?page= so they don’t full reload
    el.content.querySelectorAll('a[href*="?page="]').forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;
      const m = href.match(/\?page=([^#&]+)/);
      if (m) {
        const slug = m[1].trim();
        if (slug === "game" && href.includes("id=")) return;
        a.addEventListener("click", (e) => {
          e.preventDefault();
          navigateTo(slug);
        });
      }
    });

    // Render mentions (Inspired by) when container is present
    el.content.querySelectorAll("[data-dx-mentions]").forEach((container) => {
      content.renderMentionsInto(container);
    });

    el.content.querySelectorAll("[data-dx-overlays]").forEach((container) => {
      content.renderOverlaysInto(container);
    });
    el.content.querySelectorAll("[data-dx-widgets]").forEach((container) => {
      content.renderWidgetsInto(container);
    });
    el.content.querySelectorAll("[data-dx-inventory]").forEach((container) => {
      content.renderInventoryInto(container);
    });
    el.content.querySelectorAll("[data-dx-action-imports]").forEach((container) => {
      content.renderActionImportsInto(container);
    });

    el.content.querySelectorAll("[data-dx-import-box]").forEach((container) => {
      content.renderImportBox(container);
    });
    el.content.querySelectorAll("[data-dx-overlay-url]").forEach((container) => {
      content.renderOverlayUrlBox(container);
    });
    el.content.querySelectorAll("[data-dx-dynamic-links]").forEach((container) => {
      content.renderDynamicLinks(container);
    });
    el.content.querySelectorAll("[data-dx-touch-portal]").forEach((container) => {
      content.renderTouchPortalTabs(container);
    });
    el.content.querySelectorAll("[data-dx-emotes]").forEach((container) => {
      content.renderEmotesInto(container);
    });
    el.content.querySelectorAll("[data-dx-games]").forEach((container) => {
      content.renderGamesInto(container);
    });

    const musicContent = el.content.querySelector("[data-dx-music-content]");
    const musicTabs = el.content.querySelector("[data-dx-music-tabs]");
    const musicAlbums = el.content.querySelector("[data-dx-music-albums]");
    if (musicContent || musicTabs) music.renderMusicPage(musicTabs, musicAlbums, musicContent);

    nav.refreshDiscoverGrid();

    // Viewer page: load and render doc from ?path= (markdown or plain text)
    const viewerContent = el.content.querySelector("[data-dx-viewer]");
    if (viewerContent) initViewer(viewerContent);
    const viewerBack = document.getElementById("dxViewerBack");
    if (viewerBack) {
      viewerBack.addEventListener("click", () => {
        if (window.history.length > 1) window.history.back();
        else navigateTo("html-widgets");
      });
    }

    // Game detail page: load and render from ?id= and games.json
    const gameContent = el.content.querySelector("[data-dx-game]");
    if (gameContent) content.renderGameDetailPage(gameContent);

    // Inline doc: load markdown/text from path and render into [data-dx-doc] containers
    el.content.querySelectorAll("[data-dx-doc]").forEach((container) => {
      const path = container.getAttribute("data-dx-doc");
      if (!path) return;
      container.innerHTML = "<p class=\"dx-muted\">Loading…</p>";
      const base = getBaseUrlWithSlash();
      fetch(base + path.replace(/^\//, ""), { cache: "no-cache" })
        .then((res) => {
          if (!res.ok) throw new Error(res.status);
          return res.text();
        })
        .then((text) => {
          const ext = (path.split(".").pop() || "").toLowerCase();
          if (ext === "md" || ext === "markdown") {
            container.innerHTML = "<div class=\"dx-viewer-prose\">" + mdToHtml(text) + "</div>";
          } else {
            container.innerHTML = "<pre class=\"dx-viewer-pre\">" + escapeHtml(text) + "</pre>";
          }
        })
        .catch(() => {
          container.innerHTML = "<p class=\"dx-muted\">Could not load guide.</p>";
        });
    });

    // Render command catalogs (if present on the page)
    el.content.querySelectorAll("[data-dx-commands]").forEach((container) => {
      content.loadCommandsCatalog()
        .then((catalog) => {
          content.renderCommandsCatalogInto(container, catalog);
        })
        .catch((err) => {
          container.innerHTML = `
            <div class="dx-card">
              <h2 class="dx-heading-reset">Commands</h2>
              <p class="dx-muted">Couldn’t load commands catalog.</p>
              <pre>${escapeHtml(String(err instanceof Error ? err.message : err))}</pre>
            </div>
          `;
        });
    });

    // Streaming rota: live clock + next stream + weekly view
    content.renderRotaDateTime(el.content);
    el.content.querySelectorAll("[data-dx-streaming-rota]").forEach((container) => content.renderStreamingRota(container));
    el.content.querySelectorAll("[data-dx-rota-week]").forEach((container) => content.renderRotaWeek(container));
  }

  async function loadContent(page) {
    if (!el.content) return;
    ui.showLoading(true);
    el.content.classList.add("dx-content--entering");

    try {
      const key = page.contentFile;
      if (contentCache.has(key)) {
        el.content.innerHTML = contentCache.get(key);
        document.title = `${page.title} — DexNeXuS`;
        updateOpenGraph(page);
        postProcessContent();
        const relatedWrap = document.createElement("section");
        relatedWrap.className = "dx-card dx-related-section";
        relatedWrap.style.marginTop = "14px";
        const relatedContainer = document.createElement("div");
        relatedContainer.setAttribute("data-dx-related", page.slug);
        relatedWrap.appendChild(relatedContainer);
        el.content.appendChild(relatedWrap);
        content.renderRelatedInto(relatedContainer, page.slug);
        return;
      }

      const res = await fetch(page.contentFile, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to load ${page.contentFile} (${res.status})`);
      const html = await res.text();
      contentCache.set(key, html);
      el.content.innerHTML = html;
      document.title = `${page.title} — DexNeXuS`;
      updateOpenGraph(page);
      postProcessContent();

      const relatedWrap = document.createElement("section");
      relatedWrap.className = "dx-card dx-related-section";
      relatedWrap.style.marginTop = "14px";
      const relatedContainer = document.createElement("div");
      relatedContainer.setAttribute("data-dx-related", page.slug);
      relatedWrap.appendChild(relatedContainer);
      el.content.appendChild(relatedWrap);
      content.renderRelatedInto(relatedContainer, page.slug);
    } catch (err) {
      el.content.innerHTML = `
        <div class="dx-card">
          <h1>Couldn’t load that page</h1>
          <p class="dx-muted">Try refreshing. If you’re running this locally, use a local web server (not file://).</p>
          <pre>${String(err instanceof Error ? err.message : err)}</pre>
        </div>
      `;
    } finally {
      ui.showLoading(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.content?.classList.remove("dx-content--entering");
        });
      });
    }
  }

  const navApi = {
    getManifest: () => manifest,
    getNavConfig: () => navConfig,
    el,
    getPageBySlug,
    getRouteSlug,
    getBaseUrlWithSlash,
    resolveImagePath,
    resolvePageCardImage,
    loadJsonManifest,
    navigateTo: () => Promise.resolve(),
  };
  const nav = createNav(navApi);
  navApi.navigateTo = async function (slug, replace = false) {
    const page = getPageBySlug(slug) || getPageBySlug("home") || manifest.pages[0];
    if (!page) return;
    setRouteSlug(page.slug, replace);
    nav.updateNavActive(page.slug);
    await loadContent(page);
    // Scroll to top after content is in the DOM; use rAF so it runs after layout
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  };

  function navigateTo(slug, replace = false) {
    return navApi.navigateTo(slug, replace);
  }

  const music = createMusic({
    getBaseUrlWithSlash,
    resolveImagePath,
    loadJsonManifest,
  });

  function setSiteConfig(partial) {
    if (partial && partial.links) {
      siteConfig = siteConfig || {};
      siteConfig.links = partial.links;
    }
  }

  const content = createContent({
    getManifest: () => manifest,
    getSiteConfig: () => siteConfig,
    setSiteConfig,
    getBaseUrlWithSlash,
    resolveImagePath,
    loadJsonManifest,
    navigateTo,
    copyText: ui.copyText,
    toast: ui.toast,
    initCopyButtons: ui.initCopyButtons,
    initExternalLinks: ui.initExternalLinks,
    el,
    getNextStreamFromRota,
    getRotaWeekEntries,
  });

  async function loadManifest() {
    const data = await loadSiteData();
    manifest = data.manifest;
    siteConfig = data.siteConfig;
    imageMap = data.imageMap;
    navConfig = data.navConfig;
  }

  function wireUI() {
    // Secret: triple-click logo within 1 second -> Backups page
    let logoClickTimes = [];
    let logoHomeTimeout = 0;
    if (el.brand) {
      el.brand.addEventListener("click", (e) => {
        e.preventDefault();
        const now = Date.now();
        logoClickTimes = logoClickTimes.filter((t) => now - t < 1000);
        logoClickTimes.push(now);
        if (logoHomeTimeout) {
          clearTimeout(logoHomeTimeout);
          logoHomeTimeout = 0;
        }
        if (logoClickTimes.length >= 3) {
          logoClickTimes = [];
          navigateTo("backups");
        } else {
          logoHomeTimeout = window.setTimeout(() => {
            logoHomeTimeout = 0;
            navigateTo("home");
          }, 350);
        }
      });
    }

    if (el.navToggle) {
      el.navToggle.addEventListener("click", () => {
        const isOpen = el.navPanel?.dataset.open === "true";
        nav.setNavOpen(!isOpen);
        if (!isOpen) el.search?.focus();
      });
    }

    document.addEventListener("click", (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (el.navPanel && el.navToggle) {
        const open = el.navPanel.dataset.open === "true";
        if (open && !el.navPanel.contains(target) && !el.navToggle.contains(target)) nav.setNavOpen(false);
      }
      if (el.navDesktop && !el.navDesktop.contains(target)) nav.closeAllDesktopDropdowns();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        nav.setSearchOverlayOpen(false);
        nav.closeAllDesktopDropdowns();
        nav.setNavOpen(false);
      }
    });

    if (el.search) {
      el.search.addEventListener("input", () => {
        nav.renderNav(el.search?.value || "");
        nav.refreshDiscoverGrid();
      });
    }

    if (el.searchTrigger) {
      el.searchTrigger.addEventListener("click", () => nav.setSearchOverlayOpen(true));
    }
    if (el.searchClose) {
      el.searchClose.addEventListener("click", () => nav.setSearchOverlayOpen(false));
    }
    if (el.searchOverlayInput) {
      el.searchOverlayInput.addEventListener("input", () => {
        nav.renderSearchResults(el.searchOverlayInput?.value || "");
        nav.refreshDiscoverGrid();
      });
    }

    document.querySelectorAll(".dx-footer-links a[href*='?page=']").forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = /** @type {HTMLAnchorElement} */ (a).getAttribute("href") || "";
        const m = href.match(/\?page=([^#&]+)/);
        if (m) {
          e.preventDefault();
          const slug = m[1].trim();
          const goToMentions = href.includes("#mentions");
          void navigateTo(slug).then(() => {
            if (goToMentions && slug === "home") {
              window.location.hash = "mentions";
              requestAnimationFrame(() => {
                document.getElementById("mentions")?.scrollIntoView({ behavior: "smooth" });
              });
            }
          });
        }
      });
    });

    if (el.copyPageLink) {
      el.copyPageLink.addEventListener("click", async (e) => {
        e.preventDefault();
        const ok = await ui.copyText(window.location.href);
        ui.toast(ok ? "Copied" : "Copy failed", ok ? "Page link copied." : "Your browser blocked clipboard access.", ok);
      });
    }

    const twitchSlot = document.getElementById("dxTwitchSlot");
    const twitchBtn = twitchSlot?.querySelector(".dx-twitch-login");
    if (twitchBtn) {
      twitchBtn.addEventListener("click", () => {
        const demo = sessionStorage.getItem("dx-twitch-demo") === "1";
        if (demo) {
          sessionStorage.removeItem("dx-twitch-demo");
          twitchBtn.textContent = "Log in with Twitch";
          ui.toast("Logged out", "Twitch session cleared (demo).");
        } else {
          sessionStorage.setItem("dx-twitch-demo", "1");
          twitchBtn.textContent = "Log out";
          ui.toast("Twitch login (demo)", "Real Twitch OAuth can be added later for gated content.");
        }
      });
      if (sessionStorage.getItem("dx-twitch-demo") === "1") {
        twitchBtn.textContent = "Log out";
      }
    }
  }

  window.addEventListener("popstate", () => {
    void navigateTo(getRouteSlug(), true);
  });

  async function boot() {
    wireUI();
    music.initMusicPlayer();
    ui.showLoading(true);

    try {
      await loadManifest();
      content.renderHeaderSocials();
      nav.renderNav("");
      nav.renderNavDesktop();
      const slug = getRouteSlug();
      await navigateTo(slug, true);
    } catch (err) {
      if (el.content) {
        el.content.innerHTML = `
          <div class="dx-card">
            <h1>Startup failed</h1>
            <p>Couldn’t load the site manifest. If you’re running locally, use a local server.</p>
            <pre>${String(err instanceof Error ? err.message : err)}</pre>
          </div>
        `;
      }
    } finally {
      ui.showLoading(false);
    }
  }

  void boot();
})();

