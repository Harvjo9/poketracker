# Poké Track Android v0.3.5

Unofficial personal Living Dex tracker for Android. This repo contains the Android WebView project and offline HTML/CSS/JS data.

Open Actions → Build Poké Track APK; download the artifact. Use the supplied APK on Android 8+ only if you trust this repository. Progress is local unless Supabase sync is configured. Back up your data before updates.

**Important:** A GitHub debug APK may use a different key at every build. To enable ordinary over-the-top APK updates, securely set up the private release signing secrets (instructions below). Until then the workflow provides a debug testing APK only. **Export and verify a backup** before replacing an existing APK.

Cloud sync is not configured by default: it requires your own Supabase project, SQL setup, and email login. See [v0.3.3 Setup Guide](docs/RELIABILITY_SETUP_V033.md).

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

## v0.3.3 — Reliability, stable signing preparation and safer cloud merging
- v0.3.2 is preserved in `stable/v0.3.2-home-dex` as the last working checkpoint.
- Configurable **stable release signing** accepts a private keystore and password from GitHub Actions repository secrets. Secrets are NOT stored in the repository; until configured, only a temporary debug APK is delivered. A one-time backup/reinstall may be needed to move to the stable key.
- Native Android backup dialog reports actual file-save success back to the app. Settings shows the last **confirmed** successful backup, not merely when a download was requested.
- Backup restore now previews a valid v0.1-format JSON backup, counts its records, and rejects malformed entries **before** replacing existing saved data. Local writes commit atomically or leave the previous in-memory progress unchanged.
- Sync uses a guarded SQL RPC that does not let a stale device overwrite a newer server record between reads. Database Row Level Security remains enabled and only a signed-in user's own rows can be changed. Last successful sync time persists across launches.
- Free-tier account setup and the owner-only release signing steps are documented in [docs/RELIABILITY_SETUP_V033.md](docs/RELIABILITY_SETUP_V033.md). These services must be configured by the project owner; no cloud account or GitHub secret is created automatically.

**Backups remain essential**: Last-write-wins cloud syncing does not protect against accidental checkmarks or restores, and client device clocks need to be reasonably accurate. Never put a service-role API key, private signing keystore, or passwords in committed files.

## v0.3.4 — Free cloud project connected
- **Poke Track** Supabase project is active on the Free plan in US East (Ohio).
- The database `public.user_entries` has Row Level Security and per-user SELECT/INSERT/UPDATE rules. The `public.merge_user_entries` RPC uses SECURITY INVOKER and compares timestamps before writing.
- `app/src/main/assets/www/config.js` now embeds ONLY the project's public URL and `sb_publishable_...` client key. This key may be shipped in a public APK; **never commit a service-role key or any signing secrets**.
- The app can sign in and sync after the owner changes the Supabase **Magic Link email template** to include `{{ .Token }}`, then signs in with an email code in Settings.
- The project is linked in source, but no user's Pokémon progress has been imported or tested between devices yet. That requires sign-in and a verification round trip on the real device.
- Local backups remain necessary; a new Android build can still have a different debug signing identity until the user's private stable signing secrets are configured.

See the [project-specific email-code template](https://supabase.com/dashboard/project/bsukdkdwubebopupmoan/auth/templates/magic-link-or-otp) and [safe update guide](docs/RELIABILITY_SETUP_V033.md).

## v0.3.5 — Free Magic Link login (no custom SMTP)
Supabase restricted Free-tier email-template editing on June 3, 2026. The prior UI erroneously required a numeric OTP, but the default sender delivers a Magic Link. Version 0.3.5 accepts the default link: send email, long-press **Sign in** in the email to copy the link address *without opening it*, paste the full Supabase URL into the app's password-masked field, then tap **Sign in with link**. A strict validator allows only this project's HTTPS `/auth/v1/verify` links with acceptable one-time token types and then POSTs the token hash to that same Supabase project. Never paste the sign-in link into chats or bug reports.

The default Supabase email service may send only to email addresses belonging to the Supabase project team. Team members can test for free; third-party SMTP is not configured or required for initial owner use. This update retains independent checklist keys, previous JSON backup format, and the free database. **Back up before installing** while the permanent signing key is not yet configured. See [setup guide](docs/RELIABILITY_SETUP_V033.md).
