# Android debug keystore fingerprints (Side Quest)

Generated for Google Cloud **Android OAuth client** setup.

| Field | Value |
|-------|-------|
| Package name | `au.enginelabs.sidequest` |
| Keystore | `~/.android/debug.keystore` (created if missing) |
| Alias | `androiddebugkey` |

## SHA-1 (paste into Google Cloud → Android OAuth client)

```
DE:CB:16:82:4D:A1:1B:D6:C2:CB:06:50:9A:84:6A:5F:BD:07:FC:77
```

## SHA-256 (optional; some consoles ask for it)

```
AF:C1:AF:B5:5D:CA:9E:C6:0E:81:A4:53:A2:AD:95:AD:CD:6A:85:4F:A9:FE:57:DB:6A:11:52:31:55:AC:C7:39
```

## Google Cloud steps

1. https://console.cloud.google.com/apis/credentials?project=300778226594
2. **+ CREATE CREDENTIALS** → **OAuth client ID** → **Android**
3. Name: `Side Quest Android`
4. Package: `au.enginelabs.sidequest`
5. SHA-1: paste value above
6. Create → copy the Client ID into `.env`:

```
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=300778226594-508mlkmjir3flai0ppnotbj4niu81paf.apps.googleusercontent.com
```

7. Patch Supabase authorized client IDs:

```bash
bash scripts/patch-supabase-native-auth.sh
```

Regenerate fingerprints:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```
