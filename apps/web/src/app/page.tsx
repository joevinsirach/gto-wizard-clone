import Link from 'next/link'

const features = [
  {
    title: 'Equity Calculator',
    description: 'Calculate equity between hand ranges with board cards',
    href: '/equity',
    icon: '📊',
  },
  {
    title: 'GTO Solver',
    description: 'Solve for optimal strategies using game theory',
    href: '/train',
    icon: '🎯',
  },
  {
    title: 'Training Mode',
    description: 'Practice and improve your GTO play',
    href: '/train',
    icon: '🎓',
  },
  {
    title: 'Hand History',
    description: 'Analyze your sessions and track progress',
    href: '/analyze',
    icon: '📝',
  },
  {
    title: 'ICM Calculator',
    description: 'Make better decisions in tournament spots',
    href: '/icm',
    icon: '🏆',
  },
]

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
      <section className="text-center mb-10 sm:mb-14 lg:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-poker-gold">
          GTO Wizard Clone
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
          Master optimal poker strategy with cutting-edge GTO analysis tools
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="block p-4 sm:p-6 rounded-lg border border-gray-800 bg-gray-900/50 hover:border-poker-gold transition-all hover:scale-[1.02] sm:hover:scale-105"
          >
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h2>
            <p className="text-sm sm:text-base text-gray-400">{feature.description}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
