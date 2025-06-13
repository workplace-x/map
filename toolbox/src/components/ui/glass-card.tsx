import React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'subtle' | 'frosted' | 'tinted'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  interactive?: boolean
}

const glassVariants = {
  default: 'bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/5',
  elevated: 'bg-white/70 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-black/10',
  subtle: 'bg-white/40 backdrop-blur-lg border border-white/30 shadow-lg shadow-black/5',
  frosted: 'bg-white/80 backdrop-blur-3xl border border-white/60 shadow-2xl shadow-black/15',
  tinted: 'bg-gradient-to-br from-white/60 to-blue-100/40 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/5'
}

const blurVariants = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md', 
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl'
}

const cardAnimation = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.3, ease: 'easeOut' }
}

const hoverAnimation = {
  whileHover: { 
    scale: 1.02, 
    y: -2,
    transition: { duration: 0.2 }
  },
  whileTap: { scale: 0.98 }
}

export function GlassCard({ 
  className, 
  variant = 'default',
  blur = 'md',
  animated = false,
  interactive = false,
  children, 
  ...props 
}: GlassCardProps) {
  const baseClasses = cn(
    'rounded-2xl shadow-lg transition-all duration-300',
    glassVariants[variant],
    interactive && 'hover:shadow-xl hover:border-white/40 cursor-pointer',
    className
  )

  if (animated) {
    return (
      <motion.div
        className={baseClasses}
        {...cardAnimation}
        {...(interactive ? hoverAnimation : {})}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  )
}

// Additional glassmorphism utilities
export function GlassButton({ 
  children, 
  variant = 'default', 
  className, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'secondary' }) {
  const variants = {
    default: 'bg-white/50 hover:bg-white/70 border-white/40 text-gray-800 shadow-lg shadow-black/5',
    primary: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/40 text-blue-800 shadow-lg shadow-blue-500/20',
    secondary: 'bg-slate-500/20 hover:bg-slate-500/30 border-slate-400/40 text-slate-800 shadow-lg shadow-slate-500/20'
  }

  return (
    <motion.button
      className={cn(
        'px-6 py-3 rounded-xl backdrop-blur-xl border font-semibold text-base',
        'transition-all duration-300 hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-blue-400/50',
        variants[variant],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function GlassInput({ 
  className, 
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-5 py-4 rounded-xl text-base',
        'bg-white/50 backdrop-blur-xl border border-white/40',
        'placeholder:text-gray-500 text-gray-800 font-medium',
        'focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/60',
        'transition-all duration-300 shadow-lg shadow-black/5',
        'hover:bg-white/60 focus:bg-white/70',
        className
      )}
      {...props}
    />
  )
}

export function GlassBadge({ 
  children, 
  variant = 'default', 
  className 
}: { 
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string 
}) {
  const variants = {
    default: 'bg-white/60 text-gray-800 border-white/50 shadow-md shadow-black/5',
    success: 'bg-green-100/80 text-green-800 border-green-200/60 shadow-md shadow-green-500/20',
    warning: 'bg-yellow-100/80 text-yellow-800 border-yellow-200/60 shadow-md shadow-yellow-500/20',
    error: 'bg-red-100/80 text-red-800 border-red-200/60 shadow-md shadow-red-500/20'
  }

  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold',
      'backdrop-blur-xl border transition-all duration-300',
      'hover:scale-105',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}

// Gradient backgrounds - Light Liquid Glass
export const glassGradients = {
  dashboard: 'bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-200',
  sales: 'bg-gradient-to-br from-emerald-50 via-green-100 to-teal-200',
  ai: 'bg-gradient-to-br from-purple-50 via-violet-100 to-pink-200',
  management: 'bg-gradient-to-br from-orange-50 via-amber-100 to-red-200',
  data: 'bg-gradient-to-br from-gray-50 via-slate-100 to-zinc-200',
  customers: 'bg-gradient-to-br from-cyan-50 via-blue-100 to-indigo-200'
}

// Dark mode gradients for contrast
export const glassGradientsDark = {
  dashboard: 'bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/30',
  sales: 'bg-gradient-to-br from-slate-900 via-emerald-900/20 to-green-900/30',
  ai: 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-violet-900/30',
  management: 'bg-gradient-to-br from-slate-900 via-orange-900/20 to-amber-900/30',
  data: 'bg-gradient-to-br from-slate-900 via-gray-900/20 to-zinc-900/30',
  customers: 'bg-gradient-to-br from-slate-900 via-cyan-900/20 to-blue-900/30'
}

// Animation presets
export const glassAnimations = {
  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  staggerChildren: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: 'easeOut' }
  }
} 