// ====================================================
// PromptForge AI — Official Logo Component
// ====================================================
// Renders the official brand visual mark: P-shaped speech bubble,
// central lightning bolt, 4-point sparkle star, and blue->purple gradient.

import React from 'react'

export interface LogoProps {
  className?: string
  size?: number
  variant?: 'icon-only' | 'full' | 'monochrome'
  showTagline?: boolean
}

export function Logo({
  className = '',
  size = 24,
  variant = 'icon-only',
  showTagline = false
}: LogoProps): JSX.Element {
  const gradientId = React.useId()

  const iconSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Speech Bubble 'P' shape */}
      <path
        d="M 236 100 C 316 100 376 160 376 236 C 376 308 322 366 252 371 L 252 372 C 220 372 192 384 168 408 C 152 424 136 432 128 428 C 120 424 122 404 128 388 C 134 372 136 356 132 342 C 108 314 96 277 96 236 C 96 160 156 100 236 100 Z"
        fill={variant === 'monochrome' ? 'currentColor' : `url(#${gradientId})`}
      />

      {/* Lightning Bolt cutout */}
      <path
        d="M 268 152 L 194 266 H 244 L 204 352 L 286 232 H 236 Z"
        fill={variant === 'monochrome' ? 'var(--color-bg, #0B1220)' : '#FFFFFF'}
      />

      {/* Sparkle Star */}
      <path
        d="M 408 80 Q 408 108 436 108 Q 408 108 408 136 Q 408 108 380 108 Q 408 108 408 80 Z"
        fill={variant === 'monochrome' ? 'currentColor' : '#FFFFFF'}
      />
    </svg>
  )

  if (variant === 'icon-only') {
    return iconSvg
  }

  return (
    <div className={`inline-flex items-center gap-xs select-none ${className}`}>
      {iconSvg}
      <div className="flex flex-col">
        <div className="flex items-center font-bold tracking-tight text-text-primary leading-none">
          <span>PromptForge</span>
          <span className="text-[#8B5CF6] ml-1">AI</span>
        </div>
        {showTagline && (
          <span className="text-[10px] text-text-muted mt-0.5">
            Forge Better Prompts. Get Better Results.
          </span>
        )}
      </div>
    </div>
  )
}
