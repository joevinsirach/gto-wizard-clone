export default function TrainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-poker-gold">Training Mode</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
          <h2 className="text-xl font-semibold mb-4">Scenario</h2>
          <div className="bg-gray-800 rounded-lg p-4 h-48 flex items-center justify-center text-gray-500">
            Current Hand Scenario
          </div>
        </div>

        <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
          <h2 className="text-xl font-semibold mb-4">Your Action</h2>
          <div className="space-y-4">
            <button className="w-full py-3 px-4 bg-poker-green text-white rounded-lg font-semibold hover:opacity-90">
              Raise
            </button>
            <button className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:opacity-90">
              Call
            </button>
            <button className="w-full py-3 px-4 bg-poker-red text-white rounded-lg font-semibold hover:opacity-90">
              Fold
            </button>
          </div>
        </div>

        <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
          <h2 className="text-xl font-semibold mb-4">GTO Solution</h2>
          <div className="bg-gray-800 rounded-lg p-4 h-48 flex items-center justify-center text-gray-500">
            Optimal Strategy Display
          </div>
        </div>
      </div>

      <div className="mt-8 border border-gray-800 rounded-lg p-6 bg-gray-900/50">
        <h2 className="text-xl font-semibold mb-4">Session Stats</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-poker-gold">0</div>
            <div className="text-gray-400 text-sm">Hands Played</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-500">0%</div>
            <div className="text-gray-400 text-sm">Accuracy</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">0</div>
            <div className="text-gray-400 text-sm">Streak</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">0</div>
            <div className="text-gray-400 text-sm">Points</div>
          </div>
        </div>
      </div>
    </div>
  )
}