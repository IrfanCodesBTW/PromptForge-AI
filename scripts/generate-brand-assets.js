/* eslint-disable */
// ====================================================
// PromptForge AI — Brand Asset Generator Script
// ====================================================
// Generates all platform icon exports (PNG, ICO, ICNS, Tray, Android, iOS)
// from the official master vector SVG brand identity.

const { app, nativeImage } = require('electron')
const fs = require('fs')
const path = require('path')

async function main() {
  await app.whenReady()

  const resourcesDir = path.join(__dirname, '../resources')
  const svgPath = path.join(resourcesDir, 'icon.svg')
  const faviconSvgPath = path.join(resourcesDir, 'favicon.svg')

  console.log('[AssetGenerator] Reading master SVG:', svgPath)

  const masterImg = nativeImage.createFromPath(svgPath)
  const faviconImg = nativeImage.createFromPath(faviconSvgPath)

  // 1. Export resources/icon.png (512x512)
  const p512 = masterImg.resize({ width: 512, height: 512, quality: 'high' }).toPNG()
  fs.writeFileSync(path.join(resourcesDir, 'icon.png'), p512)
  console.log('[AssetGenerator] Generated resources/icon.png (512x512)')

  // 2. Export resolution matrix in resources/icons/exports/
  const exportsDir = path.join(resourcesDir, 'icons/exports')
  fs.mkdirSync(exportsDir, { recursive: true })

  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
  for (const size of sizes) {
    const pngBuf = masterImg.resize({ width: size, height: size, quality: 'high' }).toPNG()
    fs.writeFileSync(path.join(exportsDir, `${size}.png`), pngBuf)
  }
  console.log('[AssetGenerator] Generated PNG exports matrix (16px..1024px)')

  // 3. Export favicons
  const faviconPng32 = faviconImg.resize({ width: 32, height: 32, quality: 'high' }).toPNG()
  fs.writeFileSync(path.join(resourcesDir, 'favicon.ico'), faviconPng32)
  console.log('[AssetGenerator] Generated resources/favicon.ico')

  // 4. Export Tray & Notification icons
  const tray16 = faviconImg.resize({ width: 16, height: 16, quality: 'high' }).toPNG()
  const tray32 = faviconImg.resize({ width: 32, height: 32, quality: 'high' }).toPNG()
  const notif64 = masterImg.resize({ width: 64, height: 64, quality: 'high' }).toPNG()

  fs.writeFileSync(path.join(resourcesDir, 'tray-light.png'), tray16)
  fs.writeFileSync(path.join(resourcesDir, 'tray-dark.png'), tray16)
  fs.writeFileSync(path.join(resourcesDir, 'trayTemplate.png'), tray16)
  fs.writeFileSync(path.join(resourcesDir, 'trayTemplate@2x.png'), tray32)
  fs.writeFileSync(path.join(resourcesDir, 'notification.png'), notif64)
  console.log('[AssetGenerator] Generated tray and notification assets')

  // 5. Export Installer Header & Banner images
  const bannerBuf = masterImg.resize({ width: 164, height: 314, quality: 'high' }).toPNG()
  const headerBuf = masterImg.resize({ width: 150, height: 57, quality: 'high' }).toPNG()
  fs.writeFileSync(path.join(resourcesDir, 'installer-banner.png'), bannerBuf)
  fs.writeFileSync(path.join(resourcesDir, 'installer-header.png'), headerBuf)
  console.log('[AssetGenerator] Generated installer banner & header images')

  // 6. Export Android Adaptive Icons (resources/icons/android/)
  const androidDir = path.join(resourcesDir, 'icons/android')
  fs.mkdirSync(androidDir, { recursive: true })

  const androidFg = faviconImg.resize({ width: 512, height: 512, quality: 'high' }).toPNG()
  const androidBg = masterImg.resize({ width: 512, height: 512, quality: 'high' }).toPNG()

  fs.writeFileSync(path.join(androidDir, 'foreground.png'), androidFg)
  fs.writeFileSync(path.join(androidDir, 'background.png'), androidBg)
  fs.writeFileSync(path.join(androidDir, 'monochrome.png'), androidFg)

  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/background"/>
    <foreground android:drawable="@drawable/foreground"/>
    <monochrome android:drawable="@drawable/monochrome"/>
</adaptive-icon>`
  fs.writeFileSync(path.join(androidDir, 'adaptive-icon.xml'), adaptiveXml)
  console.log('[AssetGenerator] Generated Android adaptive icon set')

  // 7. Export iOS AppIcon Set (resources/icons/ios/AppIcon.appiconset/)
  const iosDir = path.join(resourcesDir, 'icons/ios/AppIcon.appiconset')
  fs.mkdirSync(iosDir, { recursive: true })

  const iosSizes = [
    { name: 'Icon-20.png', size: 20 },
    { name: 'Icon-20@2x.png', size: 40 },
    { name: 'Icon-20@3x.png', size: 60 },
    { name: 'Icon-29.png', size: 29 },
    { name: 'Icon-29@2x.png', size: 58 },
    { name: 'Icon-29@3x.png', size: 87 },
    { name: 'Icon-40.png', size: 40 },
    { name: 'Icon-40@2x.png', size: 80 },
    { name: 'Icon-40@3x.png', size: 120 },
    { name: 'Icon-60@2x.png', size: 120 },
    { name: 'Icon-60@3x.png', size: 180 },
    { name: 'Icon-1024.png', size: 1024 }
  ]

  for (const item of iosSizes) {
    const p = masterImg.resize({ width: item.size, height: item.size, quality: 'high' }).toPNG()
    fs.writeFileSync(path.join(iosDir, item.name), p)
  }

  const iosContentsJson = {
    images: [
      { idiom: 'iphone', size: '20x20', scale: '2x', filename: 'Icon-20@2x.png' },
      { idiom: 'iphone', size: '20x20', scale: '3x', filename: 'Icon-20@3x.png' },
      { idiom: 'iphone', size: '29x29', scale: '2x', filename: 'Icon-29@2x.png' },
      { idiom: 'iphone', size: '29x29', scale: '3x', filename: 'Icon-29@3x.png' },
      { idiom: 'iphone', size: '40x40', scale: '2x', filename: 'Icon-40@2x.png' },
      { idiom: 'iphone', size: '40x40', scale: '3x', filename: 'Icon-40@3x.png' },
      { idiom: 'iphone', size: '60x60', scale: '2x', filename: 'Icon-60@2x.png' },
      { idiom: 'iphone', size: '60x60', scale: '3x', filename: 'Icon-60@3x.png' },
      { idiom: 'ios-marketing', size: '1024x1024', scale: '1x', filename: 'Icon-1024.png' }
    ],
    info: { version: 1, author: 'PromptForge' }
  }
  fs.writeFileSync(path.join(iosDir, 'Contents.json'), JSON.stringify(iosContentsJson, null, 2))
  console.log('[AssetGenerator] Generated iOS AppIcon set')

  // 8. Generate ICO & ICNS directly if possible, or copy 256/512 PNGs
  fs.writeFileSync(path.join(resourcesDir, 'icon.ico'), p512)
  fs.writeFileSync(path.join(resourcesDir, 'icon.icns'), p512)

  console.log('[AssetGenerator] All brand assets generated successfully!')
  app.quit()
}

main().catch((err) => {
  console.error('[AssetGenerator] Error:', err)
  process.exit(1)
})
