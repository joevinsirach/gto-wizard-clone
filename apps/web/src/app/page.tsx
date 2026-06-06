import Link from 'next/link'
import { gtoTheme } from '@/styles/gto-tokens'

const features = [
  {
    title: 'Equity Calculator',
    description: 'Calculate equity between hand ranges with board cards. Explore matchups with heatmaps, charts, and detailed breakdowns.',
    href: '/equity',
    icon: '📊',
    color: 'from-blue-600 to-blue-800',
  },
  {
    title: 'ICM Calculator',
    description: 'Make better tournament decisions with ICM-aware analysis. Factor in bubble pressure and prize pool structures.',
    href: '/icm',
    icon: '🏆',
    color: 'from-amber-600 to-amber-800',
  },
  {
    title: 'Training Mode',
    description: 'Practice GTO concepts with interactive quizzes, spot recognition, and performance tracking.',
    href: '/train',
    icon: '🎯',
    color: 'from-green-600 to-green-800',
  },
  {
    title: 'Courses',
    description: 'Structured learning paths covering fundamental to advanced GTO poker strategy concepts.',
    href: '/courses',
    icon: '📚',
    color: 'from-purple-600 to-purple-800',
  },
  {
    title: 'Analyze',
    description: 'Upload and analyze hand histories. Identify leaks, review decisions, and track your progress over time.',
    href: '/analyze',
    icon: '🔍',
    color: 'from-red-600 to-red-800',
  },
  {
    title: 'Strategy Explorer',
    description: 'Browse GTO solutions by spot, position, and stack depth. Compare strategies and export data.',
    href: '/strategy',
    icon: '♠',
    color: 'from-teal-600 to-teal-800',
  },
  {
    title: 'Spots Database',
    description: 'Search and filter common poker spots. Study preflop and postflop GTO solutions.',
    href: '/spots',
    icon: '🎲',
    color: 'from-indigo-600 to-indigo-800',
  },
  {
    title: 'Strategies',
    description: 'Access a library of pre-solved GTO strategies. Filter by game type, position, and stack depth.',
    href: '/strategies',
    icon: '📋',
    color: 'from-rose-600 to-rose-800',
  },
]

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
      {/* Hero Section */}
      <section className="text-center mb-12 sm:mb-16 lg:mb-20">
        <div className="inline-block mb-4">
          <span className="text-6xl sm:text-7xl md:text-8xl">♠</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
          <span className="text-poker-gold">GTO</span>{' '}
          <span className="text-white">Wizard</span>
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4 mb-8">
          Master optimal poker strategy with cutting-edge GTO analysis tools.
          Train smarter, analyze deeper, and play better.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/equity"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-poker-gold text-black font-semibold hover:bg-yellow-400 transition-colors text-sm sm:text-base"
          >
            <span>📊</span> Get Started
          </Link>
          <Link
            href="/train"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-600 text-gray-200 font-semibold hover:border-poker-gold hover:text-poker-gold transition-colors text-sm sm:text-base"
          >
            <span>🎯</span> Start Training
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className={`group block p-5 sm:p-6 rounded-lg border border-gray-800 bg-gradient-to-br ${feature.color}/10 hover:border-poker-gold transition-all hover:scale-[1.02] sm:hover:scale-[1.03] hover:shadow-lg hover:shadow-poker-gold/5`}
          >
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white group-hover:text-poker-gold transition-colors">
              {feature.title}
            </h2>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
              {feature.description}
            </p>
          </Link>
        ))}
      </section>

      {/* Stats / Trust Bar */}
      <section className="mt-12 sm:mt-16 lg:mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-gray-800 pt-8 sm:pt-12">
        {[
          { label: 'Hands Analyzed', value: '1M+' },
          { label: 'Active Users', value: '10K+' },
          { label: 'GTO Solutions', value: '500+' },
          { label: 'Training Modules', value: '50+' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-poker-gold">{stat.value}</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Bottom CTA */}
      <section className="mt-12 sm:mt-16 text-center">
        <p className="text-sm text-gray-500">
          Built for serious poker players. Data-driven. GTO-optimized.
        </p>
      </section>
    </div>
  )
}
