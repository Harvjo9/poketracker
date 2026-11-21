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
4. From **Actions** → **Build Poké Track APK** → **Run workflow**, start a build. The workflow will include both a temporary debug APK and a **poke-track-v0.3.3-stable-apk** artifact.
5. Verify the stable APK artifact exists. Use **only stable release APKs** for ongoing updates and preserve the key ZIP in secure backed-up storage.

**One-time migration:** a stable release cannot update an old randomly signed debug APK. Export your backup first, then uninstall the old APK if Android reports a signature conflict, install the stable APK, and restore your progress. All later release APKs signed with this same key can install over one another as normal updates. Play Protect may still display warnings for privately distributed APKs; a signing key is not a guarantee of Play Protect approval.

If the key is lost, you generally cannot sign a compatible replacement update. Keep a second secure copy. Never reveal the keystore/password publicly.

## C. Connect free-tier automatic synchronization

1. Create a project you control at [Supabase](https://supabase.com/) using its available free tier. No paid services are required or authorized by this app.
2. In Supabase **SQL Editor**, execute the latest `supabase-setup.sql` from this repository. It creates the `user_entries` table, user-specific Row Level Security policies, and the `merge_user_entries` function for atomic conflict-safe upserts.
3. In **Authentication** settings, enable Email sign-in. For a six-/eight-digit one-time code, customize the Magic Link email template so the email includes `{{ .Token }}` rather than only a link.
4. In Supabase's API/project Connect settings, copy your HTTPS **Project URL** (`https://xxxxx.supabase.co`) and the **publishable key** (`sb_publishable_...`) or the legacy public **anon key**. **Never copy a service-role key or secret API key into Poké Track or the repository**.
5. Open **Poké Track → Settings → Cloud synchronization**. Enter the URL and public key, save them, and sign in with your email verification code.
6. Make one test checkmark on the phone, confirm that **Cloud sync up to date** appears, and check the **Last sync** timestamp. Sign into the same account on the tablet, wait for sync, and verify the checkmark. Reverse the test to confirm two-way sync.
7. Check offline behavior and repeat after reconnecting. The app always works locally. Signed-in devices recheck while open, when foregrounded, and after reconnecting.

**Important limitations:** The app has not been able to log into your private Supabase project here. User account creation, SQL installation, and an end-to-end two-device sync test require you to configure your own project. The server compares per-record timestamps and rejects stale writes. Like most last-write-wins sync systems, it still assumes reasonably accurate device clocks. Keep independent JSON backups; cloud sync is **not** a replacement for backups. Restoring a prior backup on a cloud-connected device may merge cloud-only entries back; check the restore preview carefully.

## D. What GitHub produces now

- `poke-track-v0.3.3-debug-apk`: temporary testing build, new signing key each GitHub Actions run, **not** a permanent update APK.
- `poke-track-v0.3.3-stable-apk`: **only when both signing secrets are configured**, signed with your persistent key and verified by Android Build Tools.

See [GitHub documentation on Actions repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [Android signing](https://developer.android.com/studio/publish/app-signing), and [Supabase email OTP configuration](https://supabase.com/docs/guides/auth/auth-email-passwordless).
