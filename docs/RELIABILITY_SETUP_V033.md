# Poké Track v0.3.3 — Set up safer updates and automatic sync

This guide is for the **owner** of the private signing key and Supabase project.
Poké Track remains usable offline, without accounts. Neither cloud sync nor permanent release signing activates automatically.

## A. Back up your current collection first

1. Open Poké Track v0.3.2, Settings → **Save backup** (called **Download backup** in older APKs).
2. Save the JSON file via Android's system document picker.
3. Open it in My Files and check that it exists; keep a second copy in private cloud storage or on your computer.
4. **Do not uninstall** v0.3.2 until you have verified this file.

## B. Activate permanent signing for future APK updates

The release signing identity is a **private master key** and its password. It is not part of the repository. The GitHub workflow expects only these two GitHub Actions **repository secrets**:

| Secret name | Value |
|---|---|
| `POKE_TRACK_KEYSTORE_BASE64` | Base64 contents of the private `.jks` key, as supplied in your owner-only signing package |
| `POKE_TRACK_STORE_PASSWORD` | Private signing password supplied in the same package |

Key alias is fixed in the workflow as `poketrack-release`. The key password is the store password.

1. Securely download and preserve your **Poké Track Stable Signing Setup** ZIP from the original private chat.
2. In GitHub: `Harvjo9/poketracker` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
3. Add each secret, pasting the complete text from the respective private text files. **Do not upload the ZIP, keystore, Base64 text, or passwords into repository source files or a GitHub issue**.
4. From **Actions** → **Build Poké Track APK** → **Run workflow**, start a build. The workflow will include both a temporary debug APK and a **poke-track-v0.3.4-stable-apk** artifact.
5. Verify the stable APK artifact exists. Use **only stable release APKs** for ongoing updates and preserve the key ZIP in secure backed-up storage.

**One-time migration:** a stable release cannot update an old randomly signed debug APK. Export your backup first, then uninstall the old APK if Android reports a signature conflict, install the stable APK, and restore your progress. All later release APKs signed with this same key can install over one another as normal updates. Play Protect may still display warnings for privately distributed APKs; a signing key is not a guarantee of Play Protect approval.

If the key is lost, you generally cannot sign a compatible replacement update. Keep a second secure copy. Never reveal the keystore/password publicly.

## C. Connect free-tier automatic synchronization

**Project already created and database configured (November 21, 2026):** Poké Track's free Supabase project is `bsukdkdwubebopupmoan` (US East, Ohio). The database has been migrated, Row Level Security checked, and the public project URL and publishable key embedded in the v0.3.4 app. **Do not create another Supabase project.**

1. Open the [Poke Track email-code template](https://supabase.com/dashboard/project/bsukdkdwubebopupmoan/auth/templates/magic-link-or-otp). Change its email body to include `{{ .Token }}`, e.g., `<h2>Your Poké Track login code</h2><p>Enter this code in Poké Track: {{ .Token }}</p>`. Save the template. Supabase sends Magic Links by default, whereas the app expects a code.
2. Export a JSON backup from your current Poké Track APK and verify that it was saved somewhere safe.
3. Install a v0.3.4 APK when you're ready (debug signing may require a one-time uninstall/restore). Open **Settings → Cloud synchronization**. The Supabase project is already configured; simply enter your email and request a code.
4. Enter the code sent to your email, then check that the sync status becomes **Cloud sync up to date** and **Last sync** shows a recent time.
5. Make a single test checkmark on your phone and confirm sync. Sign in to the **same email account** on your tablet and confirm it appears. Test a reverse change.
6. Test offline checkmarks and verify sync after reconnecting. Core checklists always work locally.

**Existing v0.3.2 or v0.3.3 APKs:** You can connect them without updating by manually entering `https://bsukdkdwubebopupmoan.supabase.co` and the **public publishable key** from the Supabase Dashboard in Settings → Cloud synchronization. This avoids an unnecessary debug-APK reinstall.

**Important limitations:** The app has not yet authenticated to your account and cannot verify phone-to-tablet sync without you signing in. The server rejects stale writes using per-record timestamps; device clocks must be reasonably accurate. Keep independent JSON backups. Restoring a prior backup on a signed-in device may merge cloud-only entries back into the app.

## D. What GitHub produces now

- `poke-track-v0.3.4-debug-apk`: temporary testing build, new signing key each GitHub Actions run, **not** a permanent update APK.
- `poke-track-v0.3.4-stable-apk`: **only when both signing secrets are configured**, signed with your persistent key and verified by Android Build Tools.

See [GitHub documentation on Actions repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [Android signing](https://developer.android.com/studio/publish/app-signing), and [Supabase email OTP configuration](https://supabase.com/docs/guides/auth/auth-email-passwordless).
