# Safelight

A personal photo editor for a consistent Instagram feed. Static web app: no build step, no server, everything runs on the phone.

- **Colors** — tap or brush an object (or mark it in Procreate/Photoshop with a marker color) and it becomes your exact shade, keeping its own shading and texture. Smart brush/erase hug edges, edges snap to the real outline at full size, pinch to zoom. A live check shows the object averages to your hex code.
- **Feel** — tap something white to fix mixed lighting, per-photo tweaks, and a subtle "Even out all photos" / match-to-reference that never changes your painted shades
- **Adjust** — light, color, split tone, skin tone, grain
- **Recipes** — save looks, back up / restore your palette and recipes, and ease the feed back to natural over several posts

Deploy: import this repo in Vercel (framework preset "Other", no build command). Then on iPhone open the site in Safari → Share → Add to Home Screen.

When you change files, bump `VERSION` in `sw.js` so phones pick up the new version.
