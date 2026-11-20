# Poké Track Android v0.1

Unofficial personal Living Dex tracker for Android. This repo contains the Android WebView project and offline HTML/CSS/JS data.

Open Actions → Build Poké Track APK; download the artifact. Use the supplied APK on Android 8+ only if you trust this repository. Progress is local unless Supabase sync is configured. Back up your data before updates.

**Warning:** Debug APKs built from GitHub Actions use a per-run signing key. For an update APK, you may have to uninstall the previous version, which deletes local data. Export a backup first. Production signing will be set up privately later.

Cloud sync is not configured in v0.1: it requires a user-owned Supabase project and an email login.
