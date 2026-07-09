# Legal pages (GitHub Pages)

Static privacy policy and terms for Side Quest, served from this repo via GitHub Pages.

## URLs (after Pages is enabled)

| Page | URL |
|------|-----|
| Index | https://enginelabs-au.github.io/sidequest/legal/ |
| Privacy | https://enginelabs-au.github.io/sidequest/legal/privacy.html |
| Terms | https://enginelabs-au.github.io/sidequest/legal/terms.html |

Set these in `.env`:

```env
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://enginelabs-au.github.io/sidequest/legal/privacy.html
EXPO_PUBLIC_TERMS_URL=https://enginelabs-au.github.io/sidequest/legal/terms.html
```

## Enable GitHub Pages (one-time)

1. Push this repo to `master` on GitHub.
2. Repo **Settings → Pages**:
   - **Source:** Deploy from a branch
   - **Branch:** `master` → **`/docs`** folder → Save
3. Wait 1–2 minutes, then open the privacy URL above.

`docs/.nojekyll` disables Jekyll so `.html` files are served as-is.
