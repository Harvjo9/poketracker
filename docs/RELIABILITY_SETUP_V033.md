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
4. From **Actions** → **Build Poké Track APK** → **Run workflow**, start a build. The workflow will include both a temporary debug APK and a **poke-track-v0.3.5-stable-apk** artifact.
5. Verify the stable APK artifact exists. Use **only stable release APKs** for ongoing updates and preserve the key ZIP in secure backed-up storage.

**One-time migration:** a stable release cannot update an old randomly signed debug APK. Export your backup first, then uninstall the old APK if Android reports a signature conflict, install the stable APK, and restore your progress. All later release APKs signed with this same key can install over one another as normal updates. Play Protect may still display warnings for privately distributed APKs; a signing key is not a guarantee of Play Protect approval.

If the key is lost, you generally cannot sign a compatible replacement update. Keep a second secure copy. Never reveal the keystore/password publicly.

## C. Connect free-tier automatic synchronization (v0.3.5)

**The project and secure database are already configured.** Free Supabase project `bsukdkdwubebopupmoan` (US East Ohio) has verified RLS policies. Do not create another project or install custom SMTP for this personal tracker.

**Important change (2026):** New Supabase Free projects cannot edit authentication email templates when using Supabase's default email sender. The default template sends a **sign-in link**, not a numeric code. Poké Track v0.3.5 uses the default link without template editing or custom SMTP.

1. **Back up** your current Pokémon progress first, and confirm the JSON backup was saved. Never uninstall an existing testing APK before saving a backup.
2. Install v0.3.5 if you want the new Magic Link flow. Due to temporary debug signatures, Android may require a one-time uninstall and restore.
3. Open **Settings → Cloud synchronization**. The project URL and public key are already embedded; only your email is needed.
4. Tap **Send link**. Find Supabase's default email titled **Your sign-in link**. On your phone, **long-press** the email's **Sign in** link, and select **Copy link address** without opening the link. The one-time URL is a credential: never post it in a chat, screenshot, issue, or public document.
5. Return to Poké Track, paste the copied entire link into **Paste sign-in link address**, and tap **Sign in with link**. The app verifies the link with this exact Supabase project only.
6. After signing in, check **Cloud sync up to date** and the Last sync date. Make a test checkmark; sign in on the tablet with the same email and verify two-way sync. Test changes offline and after reconnecting.

**Supabase free email sender limitation:** The default provider is currently limited to sending mail to email addresses on your Supabase project team, with rate limits. Use your account/team-member email for initial testing. Sending to unrelated addresses requires a separate permitted mail delivery method; none is included or enabled here. This does not affect the offline tracker.

**Older APKs:** v0.3.4 and earlier expect numeric OTPs. They cannot consume the new link without updating. The v0.3.5 app retains the previous data and backup format. The server's timestamp-guarded updates protect newer cloud values, but backup copies are still necessary.

**Alternative later:** For a one-tap sign-in experience, Android deep-link callbacks and Supabase redirect URL configuration could be implemented in a subsequent approved update. This version uses a manual copy/paste link so there is no additional dashboard setup required.

## D. What GitHub produces now

- `poke-track-v0.3.5-debug-apk`: temporary testing build, new signing key each GitHub Actions run, **not** a permanent update APK.
- `poke-track-v0.3.5-stable-apk`: **only when both signing secrets are configured**, signed with your persistent key and verified by Android Build Tools.

See [GitHub documentation on Actions repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [Android signing](https://developer.android.com/studio/publish/app-signing), and [Supabase email OTP configuration](https://supabase.com/docs/guides/auth/auth-email-passwordless).
