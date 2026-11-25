# Hallway Dash: browser version 🎒🏃

**Website:** https://hallwaydash.org/ · **Play:** https://hallwaydash.org/play/

A 3D school-hallway endless runner. Dodge crowds, teachers and bosses on the way to class. It runs in any modern browser on phone or computer. Swipe on a phone, or use the arrow keys / WASD on a computer (Q push, E heel wheels, X combo finisher, P pause, R restart, M menu, L leaderboard, O modes, U duel a friend, 1-4 difficulty, N music, V sound effects).

- `play/index.html` is the whole game in one self-contained file (three.js, models, sounds and fonts embedded). It works offline once loaded, and you can also just download it and open it.
- `index.html` and the other `.html` pages at the root are the website: home page, guides (how to play, obstacles, power-ups, campaign, modes, tips), updates, FAQ, parents & teachers, about, contact, privacy and terms. They share `site.css`, the pictures in `img/`, and the same header and footer.
- `privacy.html` is the privacy policy (also used by the Google Play listing).
- `sitemap.xml`, `robots.txt` and `404.html` are for search engines; `_redirects` keeps old links working.

**When you publish a new game build, copy it to `play/index.html`, not the root `index.html`.** The root is the home page, which AdSense and search engines review. Add a short entry to `updates.html` for bigger releases.

## Turning on the website (one time)
1. Make this repository **public** (Settings → General → Danger zone → Change visibility).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Actions → Publish Hallway Dash (GitHub Pages) → Run workflow.** After that, every push to `main` republishes it.

## Where the source lives
The game is built from the source in the main project repository (`src/` + `python3 build.py`). This repo only holds the finished build. To update it, copy the new game `index.html` to `play/index.html` (and `privacy.html` if it changed) and push.

## Credits
All 3D art, animations and voice lines are CC0 (public domain). The fonts are SIL Open Font License. See `CREDITS.md`.
