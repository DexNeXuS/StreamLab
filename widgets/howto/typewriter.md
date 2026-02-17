# Typewriter / text effects widget

Cycling text with typewriter, word-by-word, or “reveal” effects. Use as a loading screen, “next up” line, or rotating messages in OBS.

## Quick start

1. In OBS: **Add Source → Browser**.
2. Paste the widget URL (from the site’s “Copy URL” button).
3. Set width/height (e.g. 800×120). Done.

No need to edit the HTML. Customise via the URL.

## URL parameters

Add these after `?` in the browser source URL. Use `&` between multiple params.

| Parameter        | Description | Example |
|-----------------|-------------|---------|
| `lines`         | Comma-separated list of lines to cycle through. Use `%2C` for a literal comma in a line. | `?lines=Welcome,Almost there,Starting soon` |
| `text`          | Same as `lines` (one or more lines). | `?text=Loading...` |
| `effect`        | How text appears: `typewriter`, `word-by-word`, `reveal-ascii`, `reveal-binary`, `reveal-custom`, `scroll`, or `none`. | `?effect=word-by-word` |
| `position`      | Where the text sits: `left` (default) = bottom-left, types left→right. `right` = bottom-right, types right→left. For `scroll`, controls direction (left = scroll L→R, right = R→L). | `?position=right` |
| `interval`      | Milliseconds before switching to the next line (default 5000). | `?interval=8000` |
| `typing_speed`   | Milliseconds per character for typewriter/reveal (default 50). | `?typing_speed=30` |
| `word_delay`     | Milliseconds per word for word-by-word (default 200). | `?word_delay=150` |
| `scroll_duration` | Seconds for the full scroll across the screen (default 8). Only used when `effect=scroll`. | `?effect=scroll&scroll_duration=10` |
| `custom_chars`   | Characters used for “reveal-custom” effect (default `?*#@$%`). | `?effect=reveal-custom&custom_chars=*#` |

## Examples

- **Loading screen (default):**  
  `https://yoursite.com/widgets/typewriter.html`  
  Uses built-in lines: “Loading…”, “Almost there…”, etc., with typewriter effect.

- **Your own lines:**  
  `https://yoursite.com/widgets/typewriter.html?lines=Next%3A%20Rocksmith,See%20you%20soon,Follow%20for%20more`  
  (Use “Copy URL” then add `?lines=...` with your text; commas separate lines.)

- **Word-by-word, slower:**  
  `...?effect=word-by-word&word_delay=300&lines=Welcome to the stream`

- **Reveal with binary:**  
  `...?effect=reveal-binary&typing_speed=40`

- **Bottom-right, types toward the left:**  
  `...?position=right`

- **Scroll across the screen:**  
  `...?effect=scroll&scroll_duration=10`  
  Text scrolls across (direction depends on `position`).

## Download

If you prefer to run the widget from a local file, download the HTML and open it in the browser source with a `file://` path. URL parameters still work: e.g.  
`file:///C:/path/to/typewriter.html?lines=Line1,Line2`
