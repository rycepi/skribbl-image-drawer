# Skribbl Image Drawer

[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/skribbl-image-drawer/mafohmllpgcmfonkijhemngkboidcpeg) · [Portfolio](https://leftrighthp.com)

Edge/Chromium Manifest V3 extension. Open https://skribbl.io/ after installation. The Image Drawer panel appears at the top right; click its header to collapse it.

1. Choose a local image (under 20 MB).
2. Select detail and smoothing. Medium now uses 120 grid columns, High uses 160; smoothing defaults to None to retain small features. The preview shows the target palette image. Set Drawing delay and Color change in milliseconds (lower is faster); both controls remain available while drawing.
3. During your turn, click **Draw image**. With the clear checkbox off, drawing starts on the existing canvas. Enable it to erase the canvas first. Existing marks can affect bucket fills when drawing over them.
4. Keep the tab visible. Use Pause/Resume, Stop, or Escape. A stopped or interrupted drawing remains on the canvas; enable clear before restarting if you want a fresh canvas.

The extension fits images without stretching, composites transparency onto white, reduces colors to the game's 26-color palette, orders connected islands by their enclosed silhouette area, traces each outer contour in its own color, and immediately bucket-fills it before moving to the next shape. Large silhouettes cover their holes initially; smaller details, including enclosed white areas, are painted afterward. White regions connected to the canvas edge are skipped to preserve the existing canvas background. Pale nonwhite colors are kept distinct from white so light hair and shading remain visible. It produces a stylized, stepped drawing; photos are best at low detail with strong smoothing. The preview is the target image; brush thickness and bucket behavior can cause differences on the game canvas. Pointer moves have a 20 ms safety floor plus a rendering frame, and color changes have a 50 ms floor. The game currently throttles pointer moves to 90 per second; faster commands can drop corners. Every contour is checked against canvas pixels before filling, retried at 60 ms if incomplete, and stopped if it still fails. Tool changes and fills also wait for rendering. The time estimate excludes pauses, repairs, browser throttling and slow game rendering. Choose settings that fit the remaining turn time.

## Install locally

Open `edge://extensions`, enable Developer mode, choose **Load unpacked**, and select this folder (the folder containing manifest.json). Refresh any open skribbl.io tab. Updating these files requires Reload on the extension card and refreshing the game.

## Privacy and permissions

No accounts, remote libraries, analytics, storage, background worker, network requests, or broad browser permissions. The packaged scripts run only on https://skribbl.io/. Images are decoded locally, held in memory, and discarded on page close. The resulting strokes and fills are transmitted by the game to its server and players as normal drawing commands. The extension never uploads the image file.

## Compatibility and validation

Built against the public game HTML/JavaScript retrieved October 28, 2026. The extension uses DOM controls and pointer events, not private sockets or a replacement canvas. It stops when tools/palette change, the tab is hidden, or the drawing turn ends. Future game changes may require updates. Local algorithm tests do not establish live multiplayer compatibility.

Use in rooms where the other players agree. This is an independent project, not affiliated with skribbl.io.

## Local regression checks

Run `node test-core.cjs`. Covers closed contours, holes, background omission, layered white details, parent-before-child drawing order, and 200 deterministic raster reconstruction cases. Live multiplayer behavior is not established by these tests.

## Word hint suggestions

The **Word hints · English** panel reads the visible hint automatically and lists every matching entry in the bundled English dictionary. It uses word lengths, spaces, punctuation, and revealed letter positions, updates as letters appear, and clears when the guessing hint is hidden. Scroll the list for all results; use **Show possible words** to disable it. It does not submit guesses or inspect hidden answers.

The packaged community list contains 3,686 English words collected July 10–12, 2025, from [Are-You-a-Person/skribbl-word-bank](https://github.com/Are-You-a-Person/skribbl-word-bank). It is not an authoritative current server dictionary: newer words, custom room words, and other languages may be missing. Hidden-length modes cannot be matched. Attribution and the MIT license are in WORD-LIST-LICENSE.txt. Matching is local, with no runtime downloads or additional extension permissions.

Run `node test-hints.cjs` to check all dictionary entries, partial reveals, multiword hints, punctuation, and mocked UI updates. These checks do not establish live multiplayer integration. Reload the extension and refresh existing game tabs after updating.

## Move or hide the panel

Drag the **Image Drawer** heading to move the overlay out of the chat input area. Clicking the heading without dragging still collapses it. The panel stays within the viewport and its content scrolls when needed.

Click **Hide** on the heading to remove the overlay. Click the extension icon in the browser toolbar (or the Extensions menu) and toggle **Show image drawer** to show or hide it for the current tab. Hiding does not stop an active drawing; Escape still stops it. Position and visibility reset when the game page reloads. No extra permissions are required.
