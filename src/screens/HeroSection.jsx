// ─────────────────────────────────────────────────────
// HeroSection — Full-screen split hero with:
//   • Animated geometric background (rotating rings, blobs)
//   • Bold headline with gradient text
//   • CTA buttons
//   • Stats row
//   • Right: animated dashboard card (desktop)
// ─────────────────────────────────────────────────────

// Add CSS animations
const animationStyles = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes float-a {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes float-b {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
  }
`;

// Inject animations into head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = animationStyles;
  document.head.appendChild(style);
}
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, TrendingUp, Check, Award } from 'lucide-react'
import { heroEntrance, fadeRight } from '@/lib/motion'
import { HERO_STATS } from '@/utils/constants'
import Button from '@/components/ui/Button'

export default function HeroSection() {
  const handleScroll = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0e2e 0%, #1E2460 45%, #12174a 100%)',
      }}
    >
      {/* ── Background Layer ── */}
      <HeroBackground />

      {/* ── Content ── */}
      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-24 w-full grid lg:grid-cols-2 gap-16 items-center">

        {/* Left: Text */}
        <div>
          {/* Pill badge */}
          {/* <motion.div {...heroEntrance(0.15)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7"
            style={{
              background: 'rgba(154,205,50,0.1)',
              border: '1px solid rgba(154,205,50,0.25)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: '#9ACD32', boxShadow: '0 0 6px #9ACD32' }}
            />
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: '#9ACD32', fontFamily: "'DM Sans', sans-serif" }}
            >
              Global BPO &amp; IT Solutions
            </span>
          </motion.div> */}

          {/* Headline */}
          <motion.h1
            {...heroEntrance(0.25)}
            className="font-black leading-[1.05] text-white mb-6"
            style={{
              fontFamily: "'Syne', sans-serif",
              // fontSize: 'clamp(42px, 7vw, 78px)',
              fontSize: 'clamp(42px, 7vw, 68px)',
              letterSpacing: '-0.03em',
            }}
          >
            Seamless
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #9ACD32 0%, #c8e870 60%, #9ACD32 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Support.
            </span>
            <br />
            Boundless
            <br />
            <span style={{ color: 'rgba(255,255,255,0.88)' }}>Care.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            {...heroEntrance(0.38)}
            className="text-lg leading-relaxed mb-10 max-w-xl"
            style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'DM Sans', sans-serif" }}
          >
            We deliver world-class outsourcing solutions — from IT support to accounting,
            medical billing to HR — empowering your business to scale without limits.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div {...heroEntrance(0.48)} className="flex flex-wrap gap-4 mb-12">
            <Button
              size="lg"
              variant="primary"
              onClick={() => handleScroll('contact')}
              motionProps={{ whileHover: { scale: 1.04, boxShadow: '0 16px 48px rgba(154,205,50,0.38)' } }}
            >
              Get Started <ArrowRight size={18} />
            </Button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleScroll('services')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base text-white transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Our Services <ChevronRight size={18} />
            </motion.button>
          </motion.div>

          {/* Stats row */}
          <motion.div {...heroEntrance(0.58)} className="flex items-center gap-7 flex-wrap">
            {HERO_STATS.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && (
                  <div className="w-px h-10 bg-white/10 hidden sm:block" />
                )}
                <div className="text-center">
                  <div
                    className="font-black text-white"
                    style={{ fontFamily: "'Syne', sans-serif", fontSize: '26px' }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {stat.label}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* Right: Dashboard card (desktop only) */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeRight}
          className="hidden lg:flex justify-center items-center"
        >
          <HeroDashboardCard />
        </motion.div>
      </div>

      {/* ── Curved divider ── */}
      <CurvedDivider />
    </section>
  )
}

/* ── Background Shapes ────────────────────────────── */
function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* CSS-animated rotating rings — GPU-accelerated */}
      <div
        className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full border border-white/[0.04]"
        style={{ animation: 'spin-slow 70s linear infinite', willChange: 'transform' }}
      />
      <div
        className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full"
        style={{
          border: '1px solid rgba(154,205,50,0.08)',
          animation: 'spin-slow 90s linear infinite reverse',
          willChange: 'transform',
        }}
      />

      {/* Static glow blobs */}
      <div
        className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #9ACD32, transparent)', filter: 'blur(40px)' }}
      />
      <div
        className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, #4a5fd4, transparent)', filter: 'blur(60px)' }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating shapes — CSS keyframes, no JS overhead */}
      <div
        className="absolute top-32 right-16 w-24 h-24 rounded-2xl hidden xl:block"
        style={{
          background: 'rgba(154,205,50,0.07)',
          border: '1px solid rgba(154,205,50,0.18)',
          animation: 'float-a 7s ease-in-out infinite',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute bottom-48 right-32 w-16 h-16 rounded-xl hidden xl:block"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'float-b 9s ease-in-out infinite',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute top-1/2 right-9 w-10 h-10 rounded-lg hidden xl:block"
        style={{
          background: 'rgba(154,205,50,0.14)',
          border: '1px solid rgba(154,205,50,0.3)',
          animation: 'float-a 12s ease-in-out infinite 2s',
          willChange: 'transform',
        }}
      />

      {/* Diagonal accent line */}
      <div
        className="absolute top-0 right-0 w-px h-full opacity-[0.08] hidden lg:block"
        style={{
          background: 'linear-gradient(to bottom, transparent, #9ACD32, transparent)',
          transform: 'translateX(-280px) rotate(12deg) scaleY(1.6)',
        }}
      />
    </div>
  )
}

/* ── Dashboard Card (Right side) ─────────────────── */
function HeroDashboardCard() {
  const bars = [
    { label: 'Cost Reduction',     val: 78, color: '#9ACD32'  },
    { label: 'Efficiency Gained',  val: 92, color: '#4a9fd4'  },
    { label: 'Client Satisfaction',val: 97, color: '#a855f7'  },
  ]

  return (
    <div className="relative">
      {/* Main glass card */}
      <div
        className="w-[360px] rounded-3xl p-8"
        style={{
          animation: 'float-a 6s ease-in-out infinite',
          willChange: 'transform',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Card header */}
        <div className="flex items-center gap-3 mb-7">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(154,205,50,0.14)' }}
          >
            <TrendingUp size={20} color="#9ACD32" />
          </div>
          <div>
            <div
              className="text-white text-sm font-bold"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Business Performance
            </div>
            <div
              className="text-white/40 text-xs mt-0.5"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Real-time monitoring
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="flex flex-col gap-5">
          {bars.map((bar, i) => (
            <div key={bar.label}>
              <div
                className="flex justify-between text-xs mb-1.5"
                style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', sans-serif" }}
              >
                <span>{bar.label}</span>
                <span className="font-semibold text-white">{bar.val}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bar.val}%` }}
                  transition={{ duration: 1.5, delay: 0.8 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{ background: bar.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating mini badge: Active */}
      <div
        className="absolute -bottom-12 -left-12 rounded-2xl px-4 py-3"
        style={{
          animation: 'float-b 8s ease-in-out infinite 1.5s',
          willChange: 'transform',
          background: 'rgba(30,36,96,0.92)',
          border: '1px solid rgba(154,205,50,0.3)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(154,205,50,0.15)' }}
          >
            <Check size={14} color="#9ACD32" />
          </div>
          <div>
            <div className="text-white text-xs font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
              24/7 Active
            </div>
            <div className="text-white/40 text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Always online
            </div>
          </div>
        </div>
      </div>

      {/* Floating award badge */}
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -top-8 -right-8 rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(154,205,50,0.14), rgba(154,205,50,0.05))',
          border: '1px solid rgba(154,205,50,0.25)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Award size={24} color="#9ACD32" />
      </motion.div>
    </div>
  )
}

/* ── Curved SVG Divider ───────────────────────────── */
function CurvedDivider() {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height: '60px' }}
      >
        <path d="M0,80 C480,0 960,0 1440,80 L1440,80 L0,80 Z" fill="#F5F7FA" />
      </svg>
    </div>
  )
}
