# Asset credits

All third-party art in this game is public domain (CC0 1.0). No attribution is required, but credit is given gladly.

| Asset | Author | License | Used for |
|---|---|---|---|
| Ultimate Modular Men Pack | [Quaternius](https://quaternius.com/packs/ultimatemodularcharacters.html) | CC0 1.0 | `characters/M_*.glb` |
| Ultimate Modular Women Pack | [Quaternius](https://quaternius.com/packs/ultimatemodularwomen.html) | CC0 1.0 | `characters/W_*.glb` |
| Ultimate Animated Animal Pack | [Quaternius](https://quaternius.com/packs/ultimateanimatedanimals.html) | CC0 1.0 | `pets/P_*.glb` (sidekicks) |
| Universal Animation Library (free) | [Quaternius](https://quaternius.itch.io/universal-animation-library) | CC0 1.0 | `animations/*.json` (retargeted) |
| Voiceover Pack (female announcer) | [Kenney](https://kenney.nl/assets/voiceover-pack) | CC0 1.0 | `voice/*.ogg` (real recorded voice lines) |
| "Funky Energy Loop", "Funshine", "Video Game Blockbuster" | Kevin MacLeod via [FreePD](https://freepd.com) | Public domain (CC0 1.0) | `music/*.mp3` (in-game music, re-encoded at 56 kbps) |
| "Hallway Rush Theme" + intro (`hrtheme.mp3`, `hrintro.mp3`) | Original, made for this game | Owned by the game | `music/hrtheme.mp3`, `music/hrintro.mp3` (default menu and run music) |
| Luckiest Guy, Patrick Hand fonts | Astigmatic / Patrick Wagesreiter | SIL Open Font License 1.1 | embedded UI fonts |
| three.js r149 | three.js authors | MIT | rendering (`three.min.js`, `three-extras.min.js`) |

Characters were optimized with glTF-Transform (meshopt compression). Animations were retargeted onto the
modular rigs with `tools/assets/retarget.js`. See `tools/assets/README.md` to rebuild them.
