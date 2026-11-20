# Poké Track Android v0.3.2

Unofficial personal Living Dex tracker for Android. This repo contains the Android WebView project and offline HTML/CSS/JS data.

Open Actions → Build Poké Track APK; download the artifact. Use the supplied APK on Android 8+ only if you trust this repository. Progress is local unless Supabase sync is configured. Back up your data before updates.

**Warning:** Debug APKs built from GitHub Actions use a per-run signing key. For an update APK, you may have to uninstall the previous version, which deletes local data. Export a backup first. Production signing will be set up privately later.

Cloud sync is not configured by default: it requires a user-owned Supabase project and an email login.

## v0.3.1 — Shiny Forms Dex
- The regular National Shiny Dex still tracks one Shiny per species.
- **Shiny Forms Dex** tracks form-specific Shiny targets independently, grouped by regional, alternate, Vivillon, Alcremie, Unown, Furfrou, Gigantamax-factor and Alpha categories.
- Applicable form cards show a separate gold **Shiny** toggle; toggling never automatically checks a regular form, National Shiny Dex, or other collection.
- Matching Shiny sprites load from PokeAPI's Pokémon HOME Shiny image assets when available. When the precise Shiny variant image isn't available, a generic species-level Shiny preview (or placeholder) is labeled accordingly.
- A small set of verified Shiny-locked and event-only exceptions is excluded from Shiny Forms completion counts. Other targets have not all been individually verified for attainability; this is still a **starter** catalog, not a claim that every form is obtainable.
- For example, Shiny Keldeo is included because it has been officially distributed since 2025. Poké Ball Pattern Vivillon is excluded.
- Existing owner checkmarks are preserved by keeping the previous keys and identifiers. The original form, event, team, and favorite data models are unchanged.
- Shiny artwork is loaded online rather than bundled into the APK; the app's core checklists remain local-first.

Before installing a new GitHub-built debug APK, **export and verify a backup**. Debug signing keys may change and require uninstalling the previous APK, which can erase local progress. See the current build under Actions.


## v0.3.2 — Pokémon HOME Game Dexes
All seven game groups now open populated, separately tracked HOME-origin checklists:
- Let's Go: Kanto (150)
- Nintendo Switch FireRed/LeafGreen: Kanto (GBA) (150)
- Sword/Shield: Galar (400), Isle of Armor (210), Crown Tundra (210)
- Brilliant Diamond/Shining Pearl: Sinnoh (150)
- Legends: Arceus: Hisui (242)
- Scarlet/Violet: Paldea (400), Kitakami (200), Blueberry (240)
- Legends: Z-A: Lumiose (230), Hyperspace (131), Mega Evolution (93 displayed; 81 reward-required)

The regional Pokédex species order comes from PokeAPI's pokemon_dex_numbers.csv (snapshot 2026-11-20). HOME completion requirements and exceptions were cross-checked with Pokémon HOME official features and Bulbapedia's HOME Pokédex reference. The Mega Evolution section excludes 12 Ranked/event-only Megas from reward-required progress while keeping them visible and manually checkable. The game-origin category is not verified against the user's Nintendo account: **check only after HOME actually registers the Pokémon in that game-specific Pokédex**. Each subsection's checkmarks and percentages are independent from other game Dexes and from the National Living Dex.

No existing checkmark IDs were reused or overwritten. Existing user data and backup format are unchanged. Download a JSON backup before changing GitHub-built debug APKs; GitHub's per-build signing may require reinstall.
