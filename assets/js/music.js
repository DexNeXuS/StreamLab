/* DexNeXuS — Streaming Lab — music page + mini player
   createMusic(api) returns { renderMusicPage, playTrack, initMusicPlayer }. */

import { escapeHtml, formatTime } from "./utils.js";

/**
 * @param {{
 *   getBaseUrlWithSlash: () => string,
 *   resolveImagePath: (ref: string, base?: string) => string,
 *   loadJsonManifest: (path: string) => Promise<{ albums?: Array<{ id: string, name?: string, artwork?: string }>, tabs?: Array<{ id: string, label: string }>, tracks?: Array<{ title?: string, artist?: string, file?: string, url?: string, artwork?: string, tab?: string, album?: string }> }>,
 * }} api
 * @returns {{ renderMusicPage: (tabsContainer: HTMLElement | null, albumsContainer: HTMLElement | null, contentContainer: HTMLElement | null) => void, playTrack: (index: number) => void, initMusicPlayer: () => void }}
 */
export function createMusic(api) {
  const { getBaseUrlWithSlash, resolveImagePath, loadJsonManifest } = api;

  const state = { tracks: [], currentIndex: -1, activeTab: "all", activeAlbum: "all" };

  function renderMusicPage(tabsContainer, albumsContainer, contentContainer) {
    loadJsonManifest("assets/data/music.json")
      .then((data) => {
        const albums = data.albums || [];
        const albumMap = new Map(albums.map((a) => [a.id, a]));
        const tabs = data.tabs || [];
        const tracks = data.tracks || [];
        state.tracks = tracks;

        if (tabsContainer) {
          const allBtn = `<button type="button" class="dx-music-tab dx-music-tab--active" data-dx-music-tab="all" role="tab" aria-selected="true">All</button>`;
          const tabBtns = tabs.map((t) => `<button type="button" class="dx-music-tab" data-dx-music-tab="${escapeHtml(t.id)}" role="tab" aria-selected="false">${escapeHtml(t.label)}</button>`).join("");
          tabsContainer.innerHTML = allBtn + tabBtns;
        }

        if (albumsContainer && albums.length > 1) {
          const base = getBaseUrlWithSlash();
          albumsContainer.hidden = false;
          albumsContainer.innerHTML = `
            <button type="button" class="dx-music-album-chip dx-music-album-chip--active" data-dx-music-album="all">All albums</button>
            ${albums
              .map((a) => {
                const artSrc = a.artwork ? resolveImagePath(a.artwork, base) : resolveImagePath("music-placeholder.png", base);
                return `<button type="button" class="dx-music-album-chip" data-dx-music-album="${escapeHtml(a.id)}">
                  <img src="${escapeHtml(artSrc)}" alt="" />
                  <span>${escapeHtml(a.name)}</span>
                </button>`;
              })
              .join("")}
          `;
          albumsContainer.querySelectorAll("[data-dx-music-album]").forEach((btn) => {
            btn.addEventListener("click", () => {
              const albumId = btn.getAttribute("data-dx-music-album");
              state.activeAlbum = albumId;
              albumsContainer.querySelectorAll(".dx-music-album-chip").forEach((b) => b.classList.toggle("dx-music-album-chip--active", b.getAttribute("data-dx-music-album") === albumId));
              renderContent(state.activeTab, albumId);
            });
          });
        } else if (albumsContainer) {
          albumsContainer.hidden = true;
        }

        function renderContent(filterTab, filterAlbum) {
          if (!contentContainer) return;
          let filtered = !filterTab || filterTab === "all" ? tracks : tracks.filter((t) => t.tab === filterTab);
          if (filterAlbum && filterAlbum !== "all") filtered = filtered.filter((t) => t.album === filterAlbum);
          if (!filtered.length) {
            contentContainer.innerHTML = '<p class="dx-muted">No tracks yet. Add entries to <code>assets/data/music.json</code> with <code>url</code> (link to audio) or <code>file</code> (path under <code>assets/music/</code>).</p>';
            return;
          }
          const base = getBaseUrlWithSlash();
          const byAlbum = {};
          for (const t of filtered) {
            const aid = t.album || "unknown";
            if (!byAlbum[aid]) byAlbum[aid] = [];
            byAlbum[aid].push(t);
          }
          let html = "";
          const albumOrder = albums.map((a) => a.id);
          const sortedAlbumEntries = Object.entries(byAlbum).sort(([a], [b]) => {
            const ai = albumOrder.indexOf(a);
            const bi = albumOrder.indexOf(b);
            if (ai >= 0 && bi >= 0) return ai - bi;
            if (ai >= 0) return -1;
            if (bi >= 0) return 1;
            return a.localeCompare(b);
          });
          for (const [albumId, albumTracks] of sortedAlbumEntries) {
            const album = albumMap.get(albumId);
            const albumName = album?.name || albumId;
            const albumArt = album?.artwork ? resolveImagePath(album.artwork, base) : resolveImagePath("music-placeholder.png", base);
            html += `
              <section class="dx-music-album" data-album-id="${escapeHtml(albumId)}">
                <div class="dx-music-album-header">
                  <img src="${escapeHtml(albumArt)}" alt="" class="dx-music-album-artwork" loading="lazy" />
                  <h3 class="dx-music-album-title">${escapeHtml(albumName)}</h3>
                </div>
                <div class="dx-music-grid">
                  ${albumTracks
                    .map((track) => {
                      const globalIdx = tracks.indexOf(track);
                      const artSrc = (track.artworkUrl && (track.artworkUrl.startsWith("http://") || track.artworkUrl.startsWith("https://"))) ? track.artworkUrl.trim() : (track.artwork ? resolveImagePath(track.artwork, base) : resolveImagePath("music-placeholder.png", base));
                      return `
                        <button type="button" class="dx-music-card" data-dx-music-play="${globalIdx}" role="listitem">
                          <div class="dx-music-card-artwork"><img src="${escapeHtml(artSrc)}" alt="" loading="lazy" /></div>
                          <div class="dx-music-card-info">
                            <span class="dx-music-card-title">${escapeHtml(track.title || "—")}</span>
                            <span class="dx-music-card-artist">${escapeHtml(track.artist || "—")}</span>
                          </div>
                        </button>
                      `;
                    })
                    .join("")}
                </div>
              </section>
            `;
          }
          contentContainer.innerHTML = html;

          contentContainer.querySelectorAll("[data-dx-music-play]").forEach((btn) => {
            btn.addEventListener("click", () => {
              const idx = parseInt(btn.getAttribute("data-dx-music-play"), 10);
              if (!isNaN(idx) && state.tracks[idx]) playTrack(idx);
            });
          });
        }

        renderContent("all", "all");

        tabsContainer?.querySelectorAll("[data-dx-music-tab]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const tab = btn.getAttribute("data-dx-music-tab");
            state.activeTab = tab;
            tabsContainer.querySelectorAll(".dx-music-tab").forEach((b) => {
              const isActive = b.getAttribute("data-dx-music-tab") === tab;
              b.classList.toggle("dx-music-tab--active", isActive);
              b.setAttribute("aria-selected", isActive ? "true" : "false");
            });
            albumsContainer?.querySelectorAll(".dx-music-album-chip").forEach((b) => {
              if (tab === "all") b.classList.toggle("dx-music-album-chip--active", b.getAttribute("data-dx-music-album") === state.activeAlbum);
              else b.classList.remove("dx-music-album-chip--active");
            });
            renderContent(tab, state.activeTab === "all" ? state.activeAlbum : "all");
          });
        });
      })
      .catch(() => {
        if (contentContainer) contentContainer.innerHTML = '<p class="dx-muted">Could not load music. Check <code>assets/data/music.json</code>.</p>';
      });
  }

  /** Use track.url (full URL) if present; else track.file or track.url (local path) under base + assets/music/ */
  function getTrackAudioSrc(track, base) {
    const url = (track.url || "").trim();
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) return url;
    const filePath = ((track.file || track.url) || "").replace(/^\//, "").trim();
    if (!filePath) return "";
    return base + "assets/music/" + encodeURI(filePath).replace(/#/g, "%23");
  }

  function playTrack(index) {
    const tracks = state.tracks;
    if (!tracks.length || index < 0 || index >= tracks.length) return;
    state.currentIndex = index;
    const track = tracks[index];
    const base = getBaseUrlWithSlash();
    const audio = document.getElementById("dxMusicAudio");
    const player = document.getElementById("dxMusicPlayer");
    const artworkEl = document.getElementById("dxMusicArtwork");
    const titleEl = document.getElementById("dxMusicTitle");
    const artistEl = document.getElementById("dxMusicArtist");
    if (!audio || !player) return;
    // Show player and update UI first so it appears even if the audio source fails (e.g. on GitHub with wrong URL)
    if (artworkEl) artworkEl.src = (track.artworkUrl && (track.artworkUrl.startsWith("http://") || track.artworkUrl.startsWith("https://"))) ? track.artworkUrl.trim() : (track.artwork ? resolveImagePath(track.artwork, base) : resolveImagePath("music-placeholder.png", base));
    if (titleEl) titleEl.textContent = track.title || "—";
    if (artistEl) artistEl.textContent = track.artist || "—";
    player.hidden = false;
    document.body.classList.add("dx-has-music-player");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => applyMusicTextScroll());
    });
    const src = getTrackAudioSrc(track, base);
    if (!src) return;
    try {
      audio.src = src;
      audio.load();
      audio.play().catch(() => {});
    } catch (_) {}
  }

  function applyMusicTextScroll() {
    const titleEl = document.getElementById("dxMusicTitle");
    const artistEl = document.getElementById("dxMusicArtist");
    const titleWrap = titleEl?.closest(".dx-music-player-title-wrap");
    const artistWrap = artistEl?.closest(".dx-music-player-artist-wrap");
    function setScroll(wrap, inner) {
      if (!wrap || !inner) return;
      const wrapWidth = wrap.clientWidth;
      const textWidth = inner.scrollWidth;
      const overflow = textWidth - wrapWidth;
      if (overflow > 2) {
        const scrollEnd = `-${overflow}px`;
        wrap.style.setProperty("--dx-music-scroll-end", scrollEnd);
        inner.style.setProperty("--dx-music-scroll-end", scrollEnd);
        wrap.classList.add("dx-music-scroll");
      } else {
        wrap.style.removeProperty("--dx-music-scroll-end");
        inner.style.removeProperty("--dx-music-scroll-end");
        wrap.classList.remove("dx-music-scroll");
      }
    }
    setScroll(titleWrap, titleEl);
    setScroll(artistWrap, artistEl);
  }

  function initMusicPlayer() {
    const audio = document.getElementById("dxMusicAudio");
    const player = document.getElementById("dxMusicPlayer");
    const playBtn = document.getElementById("dxMusicPlay");
    const prevBtn = document.getElementById("dxMusicPrev");
    const nextBtn = document.getElementById("dxMusicNext");
    const seekEl = document.getElementById("dxMusicSeek");
    const volumeEl = document.getElementById("dxMusicVolume");
    const timeEl = document.getElementById("dxMusicTime");
    const durationEl = document.getElementById("dxMusicDuration");
    if (!audio || !player) return;

    function updatePlayPauseIcon() {
      if (!playBtn) return;
      const icon = playBtn.querySelector(".iconify");
      if (icon) {
        icon.setAttribute("data-icon", audio.paused ? "mdi:play" : "mdi:pause");
        if (typeof window.iconify !== "undefined") window.iconify.scan(playBtn);
      }
      playBtn.setAttribute("aria-label", audio.paused ? "Play" : "Pause");
    }

    function updateProgress() {
      if (!seekEl || !audio.duration) return;
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      seekEl.value = String(pct);
      if (timeEl) timeEl.textContent = formatTime(audio.currentTime);
      if (durationEl) durationEl.textContent = formatTime(audio.duration);
    }

    audio.addEventListener("play", updatePlayPauseIcon);
    audio.addEventListener("pause", updatePlayPauseIcon);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", () => {
      if (durationEl) durationEl.textContent = formatTime(audio.duration);
      if (seekEl) seekEl.max = "100";
    });
    audio.addEventListener("ended", () => {
      const tracks = state.tracks;
      const nextIdx = state.currentIndex + 1;
      if (tracks.length && nextIdx < tracks.length) playTrack(nextIdx);
      else updatePlayPauseIcon();
    });

    playBtn?.addEventListener("click", () => {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    });
    prevBtn?.addEventListener("click", () => {
      const idx = state.currentIndex - 1;
      if (idx >= 0) playTrack(idx);
      else audio.currentTime = 0;
    });
    nextBtn?.addEventListener("click", () => {
      const idx = state.currentIndex + 1;
      const tracks = state.tracks;
      if (tracks.length && idx < tracks.length) playTrack(idx);
    });

    seekEl?.addEventListener("input", () => {
      const pct = parseFloat(seekEl.value) || 0;
      if (audio.duration) audio.currentTime = (pct / 100) * audio.duration;
    });

    function volumeFromSlider(el) {
      const v = parseFloat(el?.value);
      return Number.isNaN(v) ? 80 : Math.max(0, Math.min(100, v));
    }
    volumeEl?.addEventListener("input", () => {
      const v = volumeFromSlider(volumeEl);
      audio.volume = v / 100;
    });
    audio.volume = volumeFromSlider(volumeEl) / 100;

    const closeBtn = document.getElementById("dxMusicClose");
    closeBtn?.addEventListener("click", () => {
      audio.pause();
      player.hidden = true;
      document.body.classList.remove("dx-has-music-player");
    });
  }

  return { renderMusicPage, playTrack, initMusicPlayer };
}
