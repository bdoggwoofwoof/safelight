# Safelight

A personal photo editor for a consistent Instagram feed. Static web app: no build step, no server, everything runs on the phone.

- **Light** — tap something white to fix mixed lighting, per-photo tweaks, Match to a reference photo
- **Colors** — paint objects (or mark them in Procreate/Photoshop with a marker color) and they become your exact shade
- **Adjust** — light, color, split tone, skin tone, grain
- **Recipes** — save looks, back up / restore, and ease the feed back to natural over several posts

Deploy: import this repo in Vercel (framework preset "Other", no build command). Then on iPhone open the site in Safari → Share → Add to Home Screen.

When you change files, bump `VERSION` in `sw.js` so phones pick up the new version.
