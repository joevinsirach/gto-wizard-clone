export default function EquityPage() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-poker-gold">Equity Calculator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <div className="border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Hero Range</h2>
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4 aspect-square sm:aspect-[4/3] flex items-center justify-center text-gray-500">
            RangeGrid Component
          </div>
        </div>

        <div className="border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Villain Range</h2>
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4 aspect-square sm:aspect-[4/3] flex items-center justify-center text-gray-500">
            RangeGrid Component
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 lg:mt-8 border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Board Cards</h2>
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 h-24 sm:h-32 flex items-center justify-center text-gray-500">
          Board Display - EquityChart Component
        </div>
      </div>

      <div className="mt-4 sm:mt-6 lg:mt-8 border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Results</h2>
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 h-36 sm:h-48 flex items-center justify-center text-gray-500">
          Equity Results Table
        </div>
      </div>
    </div>
  )
}
