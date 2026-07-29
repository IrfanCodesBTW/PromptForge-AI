import os
import subprocess
import sys
from PIL import Image

def get_primary_app_icon_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Background Radial Aura Gradient (Thunder Blue on Pure White) -->
    <radialGradient id="bgAura" cx="50%" cy="40%" r="60%" fx="45%" fy="35%">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0.12"/>
      <stop offset="60%" stop-color="#3B82F6" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>

    <!-- Glass Rim Border Gradient for White Squircle -->
    <linearGradient id="glassRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0" stop-opacity="0.8"/>
      <stop offset="35%" stop-color="#2563EB" stop-opacity="0.3"/>
      <stop offset="70%" stop-color="#1D4ED8" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#CBD5E1" stop-opacity="0.8"/>
    </linearGradient>

    <!-- Thunder Blue Brand Gradient -->
    <linearGradient id="thunderBrandGradient" x1="10%" y1="10%" x2="90%" y2="90%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="45%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>

    <!-- Inner Gloss Highlight for Speech Bubble Top Edge -->
    <linearGradient id="innerHighlight" x1="30%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>

    <!-- Pure White Lightning Bolt Gradient -->
    <linearGradient id="whiteBoltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F8FAFC"/>
    </linearGradient>

    <!-- Drop Shadows for High Contrast on White -->
    <filter id="shadowSquircle" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="20" stdDeviation="28" flood-color="#0F172A" flood-opacity="0.12"/>
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#2563EB" flood-opacity="0.08"/>
    </filter>

    <filter id="shadowThunderMark" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#1E3A8A" flood-opacity="0.25"/>
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#2563EB" flood-opacity="0.2"/>
    </filter>

    <filter id="glowSparkle" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#2563EB" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- 1. Base Squircle Container Background (Pure White #FFFFFF) with Soft Drop Shadow -->
  <rect x="32" y="32" width="960" height="960" rx="216" ry="216" fill="#FFFFFF" filter="url(#shadowSquircle)"/>

  <!-- 2. Subtle Soft Surface Layer (#F8FAFC) -->
  <rect x="32" y="32" width="960" height="960" rx="216" ry="216" fill="#F8FAFC" opacity="0.6"/>

  <!-- 3. Ambient Thunder Blue Glow Aura -->
  <rect x="32" y="32" width="960" height="960" rx="216" ry="216" fill="url(#bgAura)"/>

  <!-- 4. Subtle Rim Border Stroke -->
  <rect x="34" y="34" width="956" height="956" rx="214" ry="214" fill="none" stroke="url(#glassRim)" stroke-width="4"/>

  <!-- 5. Main Brand Mark Group ('P' Speech Bubble in Thunder Blue + White Lightning Bolt) -->
  <g filter="url(#shadowThunderMark)">
    <!-- Speech Bubble 'P' Monogram Outer Shell -->
    <path d="M 480 192
             C 640 192 760 312 760 464
             C 760 608 652 724 512 734
             L 512 736
             C 448 736 392 760 344 808
             C 312 840 280 856 264 848
             C 248 840 252 800 264 768
             C 276 736 280 704 272 676
             C 224 620 200 546 200 464
             C 200 312 320 192 480 192 Z"
          fill="url(#thunderBrandGradient)"/>

    <!-- Speech Bubble Top Gloss Edge -->
    <path d="M 480 196
             C 630 196 746 310 754 456
             C 744 320 634 212 480 212
             C 326 212 216 320 206 456
             C 214 310 330 196 480 196 Z"
          fill="url(#innerHighlight)" opacity="0.5"/>

    <!-- Central Lightning Bolt (Pure White #FFFFFF) -->
    <path d="M 536 288
             L 388 516
             H 488
             L 408 688
             L 572 448
             H 472
             Z"
          fill="url(#whiteBoltGradient)"/>

    <!-- Lightning Bolt Bevel Highlight -->
    <path d="M 536 288
             L 388 516
             H 440
             L 524 384
             H 472
             L 572 448
             L 540 448
             L 472 384
             L 536 288 Z"
          fill="#FFFFFF" opacity="0.8"/>
  </g>

  <!-- 6. Primary 4-Point AI Sparkle Star (Thunder Blue / White Shimmer) -->
  <g filter="url(#glowSparkle)">
    <path d="M 816 208
             Q 816 268 876 268
             Q 816 268 816 328
             Q 816 268 756 268
             Q 816 268 816 208 Z"
          fill="#2563EB"/>

    <!-- Sparkle Center Core -->
    <polygon points="816,248 836,268 816,288 796,268" fill="#FFFFFF"/>
  </g>

  <!-- 7. Secondary Micro Sparkle Star -->
  <g opacity="0.85">
    <path d="M 236 268
             Q 236 296 264 296
             Q 236 296 236 324
             Q 236 296 208 296
             Q 236 296 236 268 Z"
          fill="#3B82F6"/>
  </g>
</svg>'''

def get_secondary_mini_icon_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Thunder Blue Brand Gradient -->
    <linearGradient id="miniThunderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="50%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>

    <!-- Outer Circular White/Blue Badge -->
    <radialGradient id="miniBadgeBg" cx="50%" cy="50%" r="50%">
      <stop offset="70%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </radialGradient>

    <!-- Rim Stroke for Taskbar Visibility -->
    <linearGradient id="miniThunderRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.4"/>
    </linearGradient>

    <filter id="miniShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0F172A" flood-opacity="0.2"/>
    </filter>

    <filter id="miniGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#2563EB" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- 1. Circular Outer Container Badge (Pure White with Thunder Blue Rim) -->
  <circle cx="256" cy="256" r="240" fill="url(#miniBadgeBg)" filter="url(#miniShadow)"/>
  <circle cx="256" cy="256" r="238" fill="none" stroke="url(#miniThunderRim)" stroke-width="4"/>

  <!-- 2. Bold Streamlined Speech Bubble 'P' Monogram in Thunder Blue -->
  <g filter="url(#miniShadow)">
    <path d="M 244 84
             C 336 84 408 156 408 248
             C 408 332 344 400 260 408
             L 260 410
             C 220 410 184 426 152 458
             C 132 478 112 488 100 482
             C 88 476 92 450 100 430
             C 108 410 110 390 104 372
             C 74 336 56 292 56 248
             C 56 156 128 84 244 84 Z"
          fill="url(#miniThunderGradient)"/>

    <!-- 3. High Visibility Central Lightning Bolt in White (#FFFFFF) -->
    <path d="M 284 140
             L 188 284
             H 256
             L 204 396
             L 316 236
             H 248
             Z"
          fill="#FFFFFF"/>

    <!-- 4. Ultra-Crisp Sparkle Star in Thunder Blue (#2563EB) -->
    <path d="M 436 100
             Q 436 136 472 136
             Q 436 136 436 172
             Q 436 136 400 136
             Q 436 136 436 100 Z"
          fill="#2563EB" filter="url(#miniGlow)"/>
  </g>
</svg>'''

def build_all():
    resources_dir = os.path.abspath('resources')
    exports_dir = os.path.join(resources_dir, 'icons', 'exports')
    os.makedirs(exports_dir, exist_ok=True)

    primary_svg_path = os.path.join(resources_dir, 'primary-app-icon.svg')
    secondary_svg_path = os.path.join(resources_dir, 'secondary-mini-icon.svg')
    legacy_svg_path = os.path.join(resources_dir, 'icon.svg')
    favicon_svg_path = os.path.join(resources_dir, 'favicon.svg')

    with open(primary_svg_path, 'w', encoding='utf-8') as f:
        f.write(get_primary_app_icon_svg())
    print("Saved primary SVG:", primary_svg_path)

    with open(secondary_svg_path, 'w', encoding='utf-8') as f:
        f.write(get_secondary_mini_icon_svg())
    print("Saved secondary SVG:", secondary_svg_path)

    # Sync with legacy icon.svg & favicon.svg
    with open(legacy_svg_path, 'w', encoding='utf-8') as f:
        f.write(get_primary_app_icon_svg())
    with open(favicon_svg_path, 'w', encoding='utf-8') as f:
        f.write(get_secondary_mini_icon_svg())

    from render_icons import render_svg_to_png

    primary_png_1024 = os.path.join(resources_dir, 'primary-app-icon.png')
    secondary_png_512 = os.path.join(resources_dir, 'secondary-mini-icon.png')
    legacy_icon_png = os.path.join(resources_dir, 'icon.png')

    print("Rendering Primary App Icon (1024x1024)...")
    render_svg_to_png(primary_svg_path, primary_png_1024, 1024, 1024)
    render_svg_to_png(primary_svg_path, legacy_icon_png, 512, 512)

    print("Rendering Secondary Mini Icon (512x512)...")
    render_svg_to_png(secondary_svg_path, secondary_png_512, 512, 512)

    # Render Export Matrix Sizes
    sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
    for sz in sizes:
        p = os.path.join(exports_dir, f'primary-{sz}.png')
        m = os.path.join(exports_dir, f'mini-{sz}.png')
        render_svg_to_png(primary_svg_path, p, sz, sz)
        render_svg_to_png(secondary_svg_path, m, sz, sz)

    # Tray & Notification PNGs
    render_svg_to_png(secondary_svg_path, os.path.join(resources_dir, 'tray-light.png'), 16, 16)
    render_svg_to_png(secondary_svg_path, os.path.join(resources_dir, 'tray-dark.png'), 16, 16)
    render_svg_to_png(secondary_svg_path, os.path.join(resources_dir, 'trayTemplate.png'), 16, 16)
    render_svg_to_png(secondary_svg_path, os.path.join(resources_dir, 'trayTemplate@2x.png'), 32, 32)
    render_svg_to_png(primary_svg_path, os.path.join(resources_dir, 'notification.png'), 64, 64)

    print("All custom Thunder Blue + White brand assets generated successfully!")

if __name__ == '__main__':
    build_all()
