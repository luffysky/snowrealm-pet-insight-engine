'use client'

import React, { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes } from 'react'

// ─── 色彩 token ─────────────────────────────────────────────────────────────
// 薰衣草紫 #b8a9e8 / 桃粉 #f5b8b5 / 冰藍 #a8d8ea

// ─── GlassPanel ─────────────────────────────────────────────────────────────
interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** 玻璃深度：light / medium / deep */
  depth?: 'light' | 'medium' | 'deep'
  /** 是否有懸停發光效果 */
  glow?: boolean
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ depth = 'medium', glow = false, className = '', children, ...props }, ref) => {
    const depthMap = {
      light:  'bg-white/8  backdrop-blur-md  border-white/20',
      medium: 'bg-white/12 backdrop-blur-xl  border-white/25',
      deep:   'bg-white/18 backdrop-blur-2xl border-white/30',
    }
    return (
      <div
        ref={ref}
        className={[
          'rounded-2xl border shadow-lg transition-all duration-300',
          depthMap[depth],
          glow && 'hover:shadow-[0_0_24px_rgba(184,169,232,0.35)] hover:border-white/40',
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassPanel.displayName = 'GlassPanel'

// ─── GlassButton ────────────────────────────────────────────────────────────
interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...props }, ref) => {
    const variantMap = {
      primary:   'bg-[#b8a9e8]/30 hover:bg-[#b8a9e8]/50 border-[#b8a9e8]/50 text-white shadow-[0_0_16px_rgba(184,169,232,0.3)]',
      secondary: 'bg-[#f5b8b5]/20 hover:bg-[#f5b8b5]/35 border-[#f5b8b5]/40 text-white',
      ghost:     'bg-white/8 hover:bg-white/15 border-white/20 text-white/80 hover:text-white',
      danger:    'bg-red-400/20 hover:bg-red-400/35 border-red-400/40 text-red-300 hover:text-red-200',
    }
    const sizeMap = {
      sm: 'px-3 py-1.5 text-sm rounded-xl gap-1.5',
      md: 'px-5 py-2.5 text-base rounded-2xl gap-2',
      lg: 'px-8 py-3.5 text-lg rounded-2xl gap-2.5',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center font-medium border backdrop-blur-sm',
          'transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
          variantMap[variant],
          sizeMap[size],
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    )
  }
)
GlassButton.displayName = 'GlassButton'

// ─── GlassInput ─────────────────────────────────────────────────────────────
interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm text-white/70 font-medium pl-1">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={[
              'w-full bg-white/10 backdrop-blur-md border rounded-xl px-4 py-2.5 text-white placeholder-white/40',
              'border-white/20 focus:border-[#b8a9e8]/60 focus:bg-white/15 focus:outline-none',
              'transition-all duration-200',
              icon ? 'pl-10' : '',
              error ? 'border-red-400/60' : '',
              className,
            ].filter(Boolean).join(' ')}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
      </div>
    )
  }
)
GlassInput.displayName = 'GlassInput'

// ─── GlassTag ────────────────────────────────────────────────────────────────
interface GlassTagProps extends HTMLAttributes<HTMLSpanElement> {
  color?: 'lavender' | 'peach' | 'ice' | 'default'
}

export const GlassTag: React.FC<GlassTagProps> = ({ color = 'default', className = '', children, ...props }) => {
  const colorMap = {
    lavender: 'bg-[#b8a9e8]/25 border-[#b8a9e8]/40 text-[#d8d0f0]',
    peach:    'bg-[#f5b8b5]/25 border-[#f5b8b5]/40 text-[#fad8d6]',
    ice:      'bg-[#a8d8ea]/25 border-[#a8d8ea]/40 text-[#c8eaf5]',
    default:  'bg-white/15 border-white/25 text-white/80',
  }
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm',
        colorMap[color],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

// ─── GlassProgress ──────────────────────────────────────────────────────────
interface GlassProgressProps {
  value: number     // 0-100
  color?: 'lavender' | 'peach' | 'ice'
  label?: string
  className?: string
}

export const GlassProgress: React.FC<GlassProgressProps> = ({
  value,
  color = 'lavender',
  label,
  className = '',
}) => {
  const fillMap = {
    lavender: 'from-[#b8a9e8] to-[#d0c8f5]',
    peach:    'from-[#f5b8b5] to-[#fad0ce]',
    ice:      'from-[#a8d8ea] to-[#c8eaf5]',
  }
  const glowMap = {
    lavender: 'shadow-[0_0_8px_rgba(184,169,232,0.6)]',
    peach:    'shadow-[0_0_8px_rgba(245,184,181,0.6)]',
    ice:      'shadow-[0_0_8px_rgba(168,216,234,0.6)]',
  }
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between text-xs text-white/60 mb-1.5">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/15">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${fillMap[color]} ${glowMap[color]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

// ─── GlassReactionButton ─────────────────────────────────────────────────────
interface GlassReactionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  emoji: string
  count?: number
  active?: boolean
}

export const GlassReactionButton: React.FC<GlassReactionButtonProps> = ({
  emoji, count, active = false, className = '', ...props
}) => (
  <button
    className={[
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm',
      'backdrop-blur-sm transition-all duration-200 active:scale-95',
      active
        ? 'bg-[#b8a9e8]/35 border-[#b8a9e8]/60 text-white shadow-[0_0_8px_rgba(184,169,232,0.4)]'
        : 'bg-white/8 border-white/20 text-white/70 hover:bg-white/15 hover:text-white',
      className,
    ].filter(Boolean).join(' ')}
    {...props}
  >
    <span>{emoji}</span>
    {count !== undefined && <span className="font-medium">{count}</span>}
  </button>
)

// ─── GlassToast ─────────────────────────────────────────────────────────────
interface GlassToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  visible?: boolean
}

export const GlassToast: React.FC<GlassToastProps> = ({ message, type = 'info', visible = true }) => {
  const typeMap = {
    success: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300',
    error:   'border-red-400/40 bg-red-400/15 text-red-300',
    info:    'border-[#b8a9e8]/40 bg-[#b8a9e8]/15 text-[#d8d0f0]',
  }
  const iconMap = { success: '✓', error: '✕', info: '✦' }
  return (
    <div
      className={[
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5',
        'px-5 py-3 rounded-2xl border backdrop-blur-xl shadow-lg text-sm font-medium',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        typeMap[type],
      ].filter(Boolean).join(' ')}
    >
      <span className="text-base">{iconMap[type]}</span>
      {message}
    </div>
  )
}

// ─── BottomNav ───────────────────────────────────────────────────────────────
interface BottomNavItem {
  icon: React.ReactNode
  label: string
  href: string
  active?: boolean
}

interface BottomNavProps {
  items: BottomNavItem[]
  className?: string
}

export const BottomNav: React.FC<BottomNavProps> = ({ items, className = '' }) => (
  <nav
    className={[
      'fixed bottom-0 left-0 right-0 z-40',
      'bg-white/10 backdrop-blur-2xl border-t border-white/20',
      'flex items-center justify-around px-2 pb-safe',
      'safe-area-inset-bottom',
      className,
    ].filter(Boolean).join(' ')}
  >
    {items.map((item) => (
      <a
        key={item.href}
        href={item.href}
        className={[
          'flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl text-xs font-medium',
          'transition-all duration-200 min-w-[60px]',
          item.active
            ? 'text-[#b8a9e8] [&>svg]:drop-shadow-[0_0_6px_rgba(184,169,232,0.8)]'
            : 'text-white/50 hover:text-white/80',
        ].filter(Boolean).join(' ')}
      >
        <span className="text-xl">{item.icon}</span>
        <span>{item.label}</span>
      </a>
    ))}
  </nav>
)

// ─── GlassDivider ────────────────────────────────────────────────────────────
export const GlassDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent ${className}`} />
)

// ─── ZCoinBadge ──────────────────────────────────────────────────────────────
interface ZCoinBadgeProps {
  amount: number
  size?: 'sm' | 'md'
  className?: string
}

export const ZCoinBadge: React.FC<ZCoinBadgeProps> = ({ amount, size = 'md', className = '' }) => (
  <span
    className={[
      'inline-flex items-center gap-1 font-semibold',
      'bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border border-yellow-400/30',
      'rounded-full text-yellow-300 backdrop-blur-sm',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      className,
    ].filter(Boolean).join(' ')}
  >
    <span>✦</span>
    <span>{amount.toLocaleString()}</span>
  </span>
)
