# Music artwork

Images for the Music page: track artwork and album covers.

## Folder structure

```
assets/images/music/
├── music-placeholder.png        ← Default when no artwork is set
├── README.md
├── soft-rules-for-existing/     ← Album folder
│   ├── soft-rules-for-existing.png   (album cover)
│   ├── Standby Light_.png
│   ├── As Soft As Weather_.png
│   └── ...
└── (other albums)/
```

- **Album folder** — One folder per album: `album-id/` containing the album cover and track artwork.
- **Album cover** — `album-id/album-id.png` or `album-id/cover.png`; reference as `album-id.png` in `albums` array.
- **Track artwork** — `album-id/Track Name_.png`; reference by filename in `music.json`.
- **music-placeholder.png** — Keep at root for tracks/albums without art.

## Adding artwork

1. Create `assets/images/music/album-id/` for a new album.
2. Add album cover and track images to that folder.
3. Reference in `assets/data/music.json`:
   - Album: `"artwork": "album-id.png"` in the `albums` array.
   - Track: `"artwork": "Track Name_.png"` (filename only; image-map finds it).

Formats: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`.

Run `npm run build:images` after adding new images.
