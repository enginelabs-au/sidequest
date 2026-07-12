# Side Quest — design assets

## UI theme reference

| File | Purpose |
|------|---------|
| [`ui/sidequest-ui-mockup-v1.png`](ui/sidequest-ui-mockup-v1.png) | Light theme — chat, profile, venue perks |
| [`ui/sidequest-ui-mockup-v2-radar-mode-room.png`](ui/sidequest-ui-mockup-v2-radar-mode-room.png) | Social Radar map, Set Your Mode, layered Room stack |
| [`ui/sidequest-map-v4-reference.png`](ui/sidequest-map-v4-reference.png) | Map screen — filter sheet, venue pins, bottom rail |
| [`ui/sidequest-venue-room-v4-reference.png`](ui/sidequest-venue-room-v4-reference.png) | Venue profile + Room grid with profile cards |
| [`ui/sidequest-social-v5-inbox-activity-discovery.png`](ui/sidequest-social-v5-inbox-activity-discovery.png) | Inbox, Activity, Discovery swipe cards, Connections grid + purple tab bar |

**Design tokens** (implemented in [`constants/theme.ts`](../constants/theme.ts)):

| Token | Value | Use |
|-------|-------|-----|
| Background | `#F3F0FA` | Screen base layer |
| Card | `#FFFFFF` | Elevated content panels |
| Brand / royal purple | `#371259` | Native icon purple — primary actions, tab bar, chips, bubbles |
| Purple dark | `#2A0D43` | Headers, shadows, pressed states |
| Coral | `#F97316` | Map pin center tab, notification badges |
| On purple | `#FFFFFF` | Text on purple surfaces |

**Layering convention:** gray `Screen` background → white `Card` components with shadow → teal/coral actions and tag pills inside cards.

## App icon

| File | Purpose |
|------|---------|
| [`icons/sidequest-icon-master-1024.png`](icons/sidequest-icon-master-1024.png) | Master source (1024×1024) — edit this, then regenerate |

**Home-screen treatment:** `generate-app-icons.py` crops the opaque raised-button artwork from the master and scales it to fill the full 1024×1024 canvas so the 3D border reaches the visible icon edges on iOS (no inset frame or white corner bubble). iOS `AppIcon.appiconset` is updated in the same run.

## Regenerate mobile icons

```bash
npm run generate:icons
```

Outputs to [`assets/images/`](../assets/images/):

| Output | Size | Use |
|--------|------|-----|
| `icon.png` | 1024×1024 | iOS + Expo app icon |
| `android-icon-foreground.png` | 1024×1024 | Android adaptive foreground |
| `android-icon-background.png` | 1024×1024 | Android adaptive background (brand purple) |
| `android-icon-monochrome.png` | 1024×1024 | Android themed icon |
| `favicon.png` | 48×48 | Web |
| `splash-icon.png` | 288×288 | Splash screen (expo-splash-screen) |

Configured in [`app.config.ts`](../app.config.ts).
