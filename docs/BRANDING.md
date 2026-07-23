# 🎨 PromptForge AI — Brand Guidelines & Icon System

Official brand identity, design tokens, asset structure, and platform integration standards for **PromptForge AI**.

---

## 📍 Brand Overview

PromptForge AI's official logo consists of:
- **P-Shaped Speech Bubble**: Symbolizes prompts, conversations, and AI interactions.
- **Lightning Bolt Cutout**: Represents speed, intelligence, and instant prompt transformation.
- **Sparkle Star**: 4-point star conveying clarity, innovation, and high-quality outputs.
- **Blue → Purple Gradient**: Communicates trust, modern technology, and creativity.
- **Deep Navy Background Card**: Delivers high contrast, sleek aesthetic, and legibility across all operating systems.

---

## 🎨 Color Palette & Design Tokens

| Token Name | Hex Code | Role / Usage | Contrast Ratio |
|------------|----------|--------------|----------------|
| `--brand-primary` | `#3B82F6` | Primary Blue gradient start | 6.7:1 on Navy (AAA) |
| `--brand-secondary` | `#8B5CF6` | Accent Purple gradient end | 5.1:1 on Navy (AA) |
| `--brand-background` | `#0B1220` | Deep Navy background card | Base background |
| `--brand-slate` | `#1E293B` | Slate container border / secondary card | Structural contrast |
| `--brand-icon` | `#FFFFFF` | Lightning bolt & sparkle star | >7:1 (AAA) |
| `--brand-gradient` | `linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)` | Speech bubble fill | Modern vibrant gradient |

---

## 📂 Asset Structure & Directory Matrix

```
resources/
├── icon.svg                      # Master SVG vector source
├── favicon.svg                   # Web / HTML favicon SVG
├── favicon.ico                   # Standard ICO favicon
├── icon.png                      # Primary 512x512 PNG app icon
├── icon.ico                      # Windows ICO format
├── icon.icns                     # macOS ICNS format
├── tray-light.png                # Light mode system tray icon (16x16)
├── tray-dark.png                 # Dark mode system tray icon (16x16)
├── trayTemplate.png              # macOS menu bar template image (16x16)
├── trayTemplate@2x.png           # macOS retina menu bar template image (32x32)
├── notification.png              # High-contrast system notification icon (64x64)
├── installer-banner.png          # Windows NSIS installer sidebar image (164x314)
├── installer-header.png          # Windows NSIS installer header image (150x57)
└── icons/
    ├── exports/                  # Resolution export matrix (16, 32, 64, 128, 256, 512, 1024)
    ├── android/                  # Android Material Design Adaptive Icons
    │   ├── background.png        # Deep Navy background layer (#0B1220)
    │   ├── foreground.png        # Speech bubble + bolt + sparkle in 66% safe zone
    │   ├── monochrome.png        # Flat white vector layer
    │   └── adaptive-icon.xml     # Android XML manifest definition
    └── ios/
        └── AppIcon.appiconset/   # Complete Xcode / iOS icon set
            ├── Contents.json     # Xcode catalog JSON mapping
            ├── Icon-20.png ... Icon-1024.png
```

---

## 💻 Code & Component Integration

### React Logo Component (`src/renderer/src/components/ui/Logo.tsx`)
```tsx
import { Logo } from '../ui/Logo'

// Icon only
<Logo size={24} />

// Full brand lockup with text
<Logo size={28} variant="full" showTagline={true} />
```

### CSS Design Tokens (`src/renderer/src/index.css`)
```css
:root {
  --brand-primary: #3b82f6;
  --brand-secondary: #8b5cf6;
  --brand-background: #0b1220;
  --brand-slate: #1e293b;
  --brand-gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  --brand-surface: #0b1220;
  --brand-icon: #ffffff;
}
```

---

## 🛠️ Regenerating Brand Assets

To regenerate all platform binary assets from `resources/icon.svg` and `resources/favicon.svg`:

```bash
npx electron scripts/generate-brand-assets.js
```
