import os
import subprocess
import sys
from PIL import Image

def render_svg_to_png(svg_path, output_png_path, width, height):
    abs_svg = os.path.abspath(svg_path)
    abs_png = os.path.abspath(output_png_path)
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ width: {width}px; height: {height}px; background: transparent; overflow: hidden; }}
  svg {{ width: {width}px; height: {height}px; display: block; }}
</style>
</head>
<body>
  {open(abs_svg, 'r', encoding='utf-8').read()}
</body>
</html>
"""
    
    temp_html = abs_svg + ".temp.html"
    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    if not os.path.exists(chrome_path):
        chrome_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
        
    cmd = [
        chrome_path,
        '--headless=new',
        f'--screenshot={abs_png}',
        f'--window-size={width},{height}',
        '--hide-scrollbars',
        '--default-background-color=00000000',
        '--force-device-scale-factor=1',
        temp_html
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(temp_html):
        os.remove(temp_html)
        
    if os.path.exists(abs_png):
        img = Image.open(abs_png)
        print(f"Successfully rendered {output_png_path}: size={img.size}, mode={img.mode}")
        return True
    else:
        print(f"Failed to render {output_png_path}. Error: {result.stderr}")
        return False

if __name__ == '__main__':
    print("Renderer utility ready.")
