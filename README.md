# Poké Track Android v0.3.1

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
