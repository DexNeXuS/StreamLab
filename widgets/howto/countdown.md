# Countdown widget

Simple countdown timer (MM:SS). Suited for “starting in X minutes” or end-of-stream countdowns.

## Quick start

1. **Option A – Copy URL:** Use “Copy URL” on the site and paste into an OBS Browser Source. You can’t change the target time via URL yet; use Option B to edit.
2. **Option B – Download:** Download the HTML, open it in an editor, find `targetDate` in the script and set your target (see below). In OBS Browser Source, use the local file path.

## Editing the target time (downloaded file)

Open the HTML and find the script block. You’ll see something like:

```js
const targetDate = new Date();
targetDate.setHours(targetDate.getHours() + 1);  // 1 hour from now
targetDate.setMinutes(0);
targetDate.setSeconds(0);
```

Change this to your target, e.g.:

- **Fixed date/time:**  
  `const targetDate = new Date("2025-12-31T20:00:00");`

- **1 hour from page load:**  
  (already in the file)

- **30 minutes from load:**  
  `targetDate.setMinutes(targetDate.getMinutes() + 30);`

Set width/height in OBS (e.g. 400×80). Refresh the browser source after changing the file.
