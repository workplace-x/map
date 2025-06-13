import { GlassCard } from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { AzureAuthForm } from './components/azure-auth-form'

export default function AzureSignIn() {
  return (
    <AuthLayout>
      <div className="w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-8 lg:gap-12 h-full">
          {/* Hero Section */}
          <div className="text-center lg:text-left px-8 lg:px-16 order-2 lg:order-1 lg:col-span-2">
            <div>
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-lg font-medium mb-12">
                <div className="w-6 h-6 mr-4 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <g className="tangram-pieces">
                      {/* Large triangle 1 - Blue */}
                      <polygon 
                        points="0,0 50,0 50,50" 
                        fill="#3b82f6" 
                        className="animate-tangram-1"
                      />
                      {/* Large triangle 2 - Purple */}
                      <polygon 
                        points="50,50 100,100 0,100" 
                        fill="#8b5cf6" 
                        className="animate-tangram-2"
                      />
                      {/* Medium triangle - Pink */}
                      <polygon 
                        points="50,0 100,0 75,25" 
                        fill="#ec4899" 
                        className="animate-tangram-3"
                      />
                      {/* Small triangle 1 - Green */}
                      <polygon 
                        points="75,25 100,50 100,0" 
                        fill="#10b981" 
                        className="animate-tangram-4"
                      />
                      {/* Small triangle 2 - Orange */}
                      <polygon 
                        points="50,50 75,25 100,50" 
                        fill="#f59e0b" 
                        className="animate-tangram-5"
                      />
                      {/* Square - Red */}
                      <polygon 
                        points="50,50 75,25 75,50 50,75" 
                        fill="#ef4444" 
                        className="animate-tangram-6"
                      />
                      {/* Parallelogram - Cyan */}
                      <polygon 
                        points="75,50 100,50 100,100 75,75" 
                        fill="#06b6d4" 
                        className="animate-tangram-7"
                      />
                    </g>
                  </svg>
                </div>
                Tangram Toolbox
              </div>
              <h1 
                className="hero-text font-bold text-white tracking-tight mb-12"
                style={{ 
                  fontSize: '120px !important',
                  lineHeight: '0.85 !important'
                }}
              >
                Crafting insights,
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  powering decisions
                </span>
              </h1>
              <p className="hero-description text-white/80 leading-relaxed max-w-4xl mx-auto lg:mx-0">
                Transform your data into actionable insights with our comprehensive business intelligence platform.
              </p>
            </div>
          </div>

          {/* Sign In Card */}
          <div className="px-8 lg:px-12 order-1 lg:order-2 flex items-center justify-center lg:col-span-1">
            <div>
              <GlassCard className="relative p-12 sm:p-16 lg:p-20 bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl w-full max-w-lg hover:bg-white/10 transition-all duration-300 group">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-12">
                    <h2 className="signin-title text-white mb-6 tracking-tight">
                      Welcome back
                    </h2>
                    <p className="signin-subtitle text-white/80">
                      Sign in to continue your journey
                    </p>
                  </div>
                  
                  <AzureAuthForm />
                  
                  <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="signin-footer text-center text-white/60 leading-relaxed">
                      By signing in, you agree to our{' '}
                      <a 
                        href="/terms" 
                        className="text-white/80 hover:text-white underline underline-offset-2 transition-colors duration-200"
                      >
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a 
                        href="/privacy" 
                        className="text-white/80 hover:text-white underline underline-offset-2 transition-colors duration-200"
                      >
                        Privacy Policy
                      </a>
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
} 