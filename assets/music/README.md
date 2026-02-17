# Music

Audio files and albums for the Music page.

## Folder structure

```
assets/music/
├── README.md
├── soft-rules-for-existing/     ← Album folder
│   ├── Standby Light_.wav
│   ├── As Soft As Weather_.wav
│   └── ...
└── (other albums)/
```

- Put audio files in album subfolders: `assets/music/album-id/filename.wav`.
- In `music.json`, use `"file": "album-id/filename.wav"`.

## Adding tracks

1. Add your audio file to `assets/music/` (or `assets/music/album-folder/`).
2. Add artwork to `assets/images/music/` (see below).
3. Edit `assets/data/music.json`:

### Track entry

```json
{
  "id": "unique-track-id",
  "album": "album-id",
  "tab": "original",
  "title": "Track title",
  "artist": "Artist name",
  "file": "filename.wav",
  "artwork": "track-artwork.png"
}
```

- **id** — Unique slug (letters, numbers, hyphens).
- **album** — Must match an album `id` in the `albums` array.
- **tab** — `original`, `suno`, or any tab id from the `tabs` array.
- **file** — Filename in `assets/music/`. For subfolders: `album-folder/filename.wav`.
- **artwork** — Filename in `assets/images/music/`. Use `music-placeholder.png` if you don't have art yet.

### Supported audio formats

`.mp3`, `.wav`, `.ogg`, `.m4a` all work in modern browsers.

---

## Adding albums

1. Add album artwork to `assets/images/music/` (e.g. `my-album.png`).
2. Add an entry to the `albums` array in `assets/data/music.json`:

```json
{
  "id": "my-album",
  "name": "My Album Name",
  "artwork": "my-album.png"
}
```

- **id** — Slug used in track `album` field.
- **name** — Display name on the page.
- **artwork** — Filename in `assets/images/music/`. Use `music-placeholder.png` as placeholder.

3. (Optional) Create `assets/music/my-album/` and put track files there. Use `"file": "my-album/track.wav"` in the track entry.

---

## Adding tabs (categories)

Edit the `tabs` array in `assets/data/music.json`:

```json
{
  "id": "suno",
  "label": "Suno"
}
```

- **id** — Used in track `tab` field.
- **label** — Shown on the tab button.
