# Hallway Dash: browser version 🎒🏃

**Play:** https://hallwaydash.org/

A 3D school-hallway endless runner. Dodge crowds, teachers and bosses on the way to class. It runs in any modern browser on phone or computer. Swipe on a phone, or use the arrow keys / WASD on a computer (Q push, E heel wheels, X combo finisher, P pause, R restart, M menu, L leaderboard, O modes, U duel a friend, 1-4 difficulty, N music, V sound effects).

- `index.html` is the game code. The big files live next to it in `game-data/`: `assets-<hash>.js` (runners, pets, animations, voice lines) and `music/*.mp3` (each track loads only when it plays). Their names change whenever their contents change, so browsers can keep them cached for a year (see `_headers`).
- `privacy.html` is the privacy policy (also used by the Google Play listing).

## Turning on the website (one time)
1. Make this repository **public** (Settings → General → Danger zone → Change visibility).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Actions → Publish Hallway Dash (GitHub Pages) → Run workflow.** After that, every push to `main` republishes it.

## Where the source lives
The game is built from the source in the main project repository (`src/` + `python3 build.py`). This repo only holds the finished build. To update it, copy the new `index.html` and `privacy.html` here and push.

## Credits
All 3D art, animations and voice lines are CC0 (public domain). The fonts are SIL Open Font License. See `CREDITS.md`.
