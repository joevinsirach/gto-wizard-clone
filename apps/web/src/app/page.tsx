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
    <div className="container mx-auto px-4 py-16">
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4 text-poker-gold">GTO Wizard Clone</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Master optimal poker strategy with cutting-edge GTO analysis tools
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="block p-6 rounded-lg border border-gray-800 bg-gray-900/50 hover:border-poker-gold transition-all hover:scale-105"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
            <p className="text-gray-400">{feature.description}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}