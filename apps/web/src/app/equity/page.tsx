export default function EquityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-poker-gold">Equity Calculator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
          <h2 className="text-xl font-semibold mb-4">Hero Range</h2>
          {/* RangeGrid component placeholder */}
          <div className="bg-gray-800 rounded-lg p-4 h-64 flex items-center justify-center text-gray-500">
            RangeGrid Component
          </div>
        </div>

        <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
          <h2 className="text-xl font-semibold mb-4">Villain Range</h2>
          {/* RangeGrid component placeholder */}
          <div className="bg-gray-800 rounded-lg p-4 h-64 flex items-center justify-center text-gray-500">
            RangeGrid Component
          </div>
        </div>
      </div>

      <div className="mt-8 border border-gray-800 rounded-lg p-6 bg-gray-900/50">
        <h2 className="text-xl font-semibold mb-4">Board Cards</h2>
        <div className="bg-gray-800 rounded-lg p-4 h-32 flex items-center justify-center text-gray-500">
          Board Display - EquityChart Component
        </div>
      </div>

      <div className="mt-8 border border-gray-800 rounded-lg p-6 bg-gray-900/50">
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        <div className="bg-gray-800 rounded-lg p-4 h-48 flex items-center justify-center text-gray-500">
          Equity Results Table
        </div>
      </div>
    </div>
  )
}