/* DexNeXuS — Streaming Lab — UI helpers (toast, copy, loading, init copy/links)
   createUI(el) returns { showLoading, toast, copyText, initCopyButtons, initExternalLinks }. */

/**
 * @param {{ loading: HTMLElement|null, toastHost: HTMLElement|null }} el
 * @returns {{
 *   showLoading: (isLoading: boolean) => void,
 *   toast: (title: string, text: string, isSuccess?: boolean) => void,
 *   copyText: (value: string) => Promise<boolean>,
 *   initCopyButtons: (scope: HTMLElement) => void,
 *   initExternalLinks: (scope: HTMLElement) => void,
 * }}
 */
export function createUI(el) {
  function showLoading(isLoading) {
    if (!el.loading) return;
    el.loading.hidden = !isLoading;
  }

  function toast(title, text, isSuccess = false) {
    if (!el.toastHost) return;
    const item = document.createElement("div");
    item.className = "dx-toast" + (isSuccess ? " dx-toast--success" : "");
    item.innerHTML = `
      <div class="dx-toast-title"></div>
      <div class="dx-toast-text"></div>
    `;
    const t = item.querySelector(".dx-toast-title");
    const p = item.querySelector(".dx-toast-text");
    if (t) t.textContent = title;
    if (p) p.textContent = text;
    el.toastHost.appendChild(item);
    window.setTimeout(() => item.remove(), isSuccess ? 3000 : 2600);
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }
  }

  function initCopyButtons(scope) {
    const root = scope || document.body;
    root.querySelectorAll("[data-copy-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-copy-id");
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) {
          toast("Copy failed", "Target not found.");
          return;
        }
        const fromAttr = target.getAttribute("data-copy-text");
        const value = (fromAttr && fromAttr.length ? fromAttr : target.textContent || "").trim();
        if (!value) {
          toast("Copy failed", "Nothing to copy.");
          return;
        }
        const ok = await copyText(value);
        toast(ok ? "Copied" : "Copy failed", ok ? "Saved to clipboard." : "Your browser blocked clipboard access.", ok);
      });
    });
  }

  function initExternalLinks(scope) {
    const root = scope || document.body;
    root.querySelectorAll('a[target="_blank"]').forEach((a) => {
      if (!a.getAttribute("rel")) a.setAttribute("rel", "noopener noreferrer");
    });
  }

  return { showLoading, toast, copyText, initCopyButtons, initExternalLinks };
}
