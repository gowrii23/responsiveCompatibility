# Responsiveness — Dual Viewport Tester

Chrome extension for side-by-side responsive testing: **mobile on the left**, **tablet on the right**, in the same browser window. Each frame scrolls and clicks on its own, using the same Chrome profile (cookies and session) as the rest of the browser.

This matches a publish-ready Manifest V3 listing: optional host access, no analytics, no remote code, and a privacy policy you can host.

## Load unpacked (development)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** and choose this repository root (the folder that contains `manifest.json`)
4. Open any website, click the extension icon, then **This tab**

Keyboard shortcut: `Alt+Shift+V` (change it under `chrome://extensions/shortcuts`).

## How it works

- The tester page (`viewer/viewer.html`) shows two iframes sized to device presets (iPhone 15 Pro portrait by default, iPad Pro landscape by default).
- Frames are scaled down to fit your window while keeping the CSS viewport (for example `393×852`) so media queries match that device width.
- Optional host permission is requested **for the URL you test**. Session `declarativeNetRequest` rules then drop `X-Frame-Options` and `Content-Security-Policy` **only on subframes initiated by this extension**, so many sites can render in the frames.
- If a site still refuses to be embedded (frame-busting scripts, login walls, or cookie partitioning), use **Dual windows** to open two real Chrome windows at those sizes. Those windows are first-party and share your normal session.

## Chrome Web Store

Pack a zip:

```bash
chmod +x scripts/pack.sh
./scripts/pack.sh
```

Upload `responsiveness.zip` in the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).

Copy for the listing is in `STORE_LISTING.md`. Host `privacy.html` at a public HTTPS URL and paste that URL into the dashboard privacy field.

### Permission justifications (paste into the dashboard)

- **activeTab** — Read the URL of the tab you are on when you click **This tab**.
- **storage** — Remember device presets, orientations, and recent test URLs on this machine.
- **declarativeNetRequestWithHostAccess** — Ignore iframe-blocking headers on preview frames after you grant site access. Rules apply only to extension-initiated subframes.
- **Host permission (optional)** — Load the site you entered in the two preview frames. Default is per-origin; all-sites is an opt-in in Settings.

Do not enable remote hosted scripts. Keep the extension single-purpose: responsive comparison only.

## Local demo page

`demo/responsive-lab.html` is a store-style layout with a hamburger + one-column grid under 768px and a sidebar + multi-column grid at tablet widths. After loading the extension, open that file via a local server (or any hosted URL) in the tester to confirm left vs right breakpoints.

## Limits

- Viewport testing follows **layout width**, not the full Chrome DevTools device emulator (touch, DPR, and per-frame User-Agent are not emulated independently).
- Some sites will not display in iframes even after header stripping. Use **Dual windows**.
- Third-party cookie partitioning can make an iframe session differ from a top-level tab. Dual windows avoid that.
