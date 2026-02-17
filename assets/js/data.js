/* DexNeXuS — Streaming Lab — data loading
   Fetches pages manifest, site config, image map, nav. No rendering. */

/**
 * Load all site data (pages, config, image map, nav) in parallel.
 * Pages are required; the rest are optional (null on failure or missing).
 * @returns {Promise<{
 *   manifest: { pages: Array<{ slug: string, title: string, description?: string, group?: string, order?: number, tags?: string[], contentFile: string }> },
 *   siteConfig: { baseUrl?: string, links?: Array<{ label: string, href: string, icon?: string }> } | null,
 *   imageMap: Record<string, string> | null,
 *   navConfig: { groups: Array<{ label: string, items: Array<{ slug?: string, label?: string, items?: Array<{ slug?: string }> }> }> } | null
 * }>}
 */
export async function loadSiteData() {
  const [pagesRes, configRes, imageMapRes, navRes] = await Promise.all([
    fetch("assets/data/pages.json", { cache: "no-cache" }),
    fetch("assets/data/site-config.json", { cache: "no-cache" }).catch(() => null),
    fetch("assets/data/image-map.json", { cache: "no-cache" }).catch(() => null),
    fetch("assets/data/nav.json", { cache: "no-cache" }).catch(() => null),
  ]);

  if (!pagesRes.ok) throw new Error(`Failed to load pages manifest (${pagesRes.status})`);
  const data = await pagesRes.json();
  if (!data || !Array.isArray(data.pages)) throw new Error("Invalid pages manifest format");
  const manifest = data;

  let siteConfig = null;
  if (configRes && configRes.ok) {
    try {
      siteConfig = await configRes.json();
    } catch {
      siteConfig = null;
    }
  }

  let imageMap = null;
  if (imageMapRes && imageMapRes.ok) {
    try {
      imageMap = await imageMapRes.json();
    } catch {
      imageMap = null;
    }
  }

  let navConfig = null;
  if (navRes && navRes.ok) {
    try {
      const navData = await navRes.json();
      if (navData && Array.isArray(navData.groups)) navConfig = navData;
    } catch {
      navConfig = null;
    }
  }

  return { manifest, siteConfig, imageMap, navConfig };
}
