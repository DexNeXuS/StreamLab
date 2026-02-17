# Touch Portal — Modular content

Add **pages** and **buttons** here. The site will list them in tabs.

## Workflow

1. **Pages**: Drop `.tpb` files into `touch-portal/pages/`
2. **Buttons**: Drop `.tpb` files into `touch-portal/buttons/`
3. Edit `pages/index.json` and `buttons/index.json` — add an entry for each file:
   ```json
   {
     "id": "my-page",
     "name": "My Page",
     "description": "What this page does.",
     "file": "my-page.tpb"
   }
   ```
4. Run `npm run build:touch-portal` (or `node tools/build-touch-portal.mjs`)
5. The Touch Portal page on the site updates — new tabs and download links appear.

No need to edit HTML. Just add files + JSON entries and rebuild.
