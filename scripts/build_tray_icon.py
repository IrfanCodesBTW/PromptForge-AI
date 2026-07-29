import os
import subprocess
from PIL import Image

def get_tray_minimized_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
  <!-- 1. Opaque Dark Slate Background Fill (#0F172A) - Compliance: No Transparency -->
  <rect x="0" y="0" width="16" height="16" fill="#0F172A"/>

  <!-- 2. 1-Pixel Outer Border (#000000) for High Contrast System Tray Rendering -->
  <rect x="0.5" y="0.5" width="15" height="15" fill="none" stroke="#000000" stroke-width="1"/>

  <!-- 3. Thunder Blue Speech Bubble 'P' Monogram (#2563EB) -->
  <path d="M 3.5 3.5 
           H 10.5 
           C 12.2 3.5 13 4.5 13 6 
           C 13 7.5 12.2 8.5 10.5 8.5 
           H 6.5 
           V 12.5 
           H 3.5 
           Z" fill="#2563EB"/>

  <!-- 4. Crisp White Central Lightning Bolt (#FFFFFF) -->
  <path d="M 8.5 3.5 
           L 5.5 7.5 
           H 7.5 
           L 6.5 11.5 
           L 10.5 6.5 
           H 8.5 
           Z" fill="#FFFFFF"/>
</svg>'''

def get_tray_minimized_2x_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <!-- 1. Opaque Dark Slate Background Fill (#0F172A) -->
  <rect x="0" y="0" width="32" height="32" fill="#0F172A"/>

  <!-- 2. 1-Pixel Outer Border (#000000) -->
  <rect x="0.5" y="0.5" width="31" height="31" fill="none" stroke="#000000" stroke-width="1"/>

  <!-- 3. Thunder Blue Speech Bubble 'P' Monogram (#2563EB) -->
  <path d="M 7 7 
           H 21 
           C 24.4 7 26 9 26 12 
           C 26 15 24.4 17 21 17 
           H 13 
           V 25 
           H 7 
           Z" fill="#2563EB"/>

  <!-- 4. Crisp White Central Lightning Bolt (#FFFFFF) -->
  <path d="M 17 7 
           L 11 15 
           H 15 
           L 13 23 
           L 21 13 
           H 17 
           Z" fill="#FFFFFF"/>
</svg>'''

def build_tray_assets():
    resources_dir = os.path.abspath('resources')
    svg_16_path = os.path.join(resources_dir, 'tray-minimized.svg')
    svg_32_path = os.path.join(resources_dir, 'tray-minimized@2x.svg')

    with open(svg_16_path, 'w', encoding='utf-8') as f:
        f.write(get_tray_minimized_svg())

    with open(svg_32_path, 'w', encoding='utf-8') as f:
        f.write(get_tray_minimized_2x_svg())

    print("Saved tray SVG master files.")

    from render_icons import render_svg_to_png

    png_16_path = os.path.join(resources_dir, 'tray-minimized.png')
    png_32_path = os.path.join(resources_dir, 'tray-minimized@2x.png')

    render_svg_to_png(svg_16_path, png_16_path, 16, 16)
    render_svg_to_png(svg_32_path, png_32_path, 32, 32)

    # Sync with tray-dark, tray-light, trayTemplate, etc.
    render_svg_to_png(svg_16_path, os.path.join(resources_dir, 'tray-dark.png'), 16, 16)
    render_svg_to_png(svg_16_path, os.path.join(resources_dir, 'tray-light.png'), 16, 16)
    render_svg_to_png(svg_16_path, os.path.join(resources_dir, 'trayTemplate.png'), 16, 16)
    render_svg_to_png(svg_32_path, os.path.join(resources_dir, 'trayTemplate@2x.png'), 32, 32)

    print("All system tray icon assets rendered successfully!")

if __name__ == '__main__':
    build_tray_assets()
