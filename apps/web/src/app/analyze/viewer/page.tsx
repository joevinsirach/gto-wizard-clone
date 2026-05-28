import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hand Viewer | GTO Wizard",
  description: "Review and analyze poker hand histories",
};

export default function HandViewerPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Hand Viewer</h1>
      <div className="grid gap-6">
        <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Hand History Viewer</h2>
          <p className="text-gray-400 mb-4">
            Upload or paste a hand history to analyze the strategy and equity
            at each decision point.
          </p>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-500">
              Paste hand history or drag &apos;n&apos; drop a file
            </p>
          </div>
        </section>

        <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Hand Analysis</h2>
          <p className="text-gray-400">
            Select a hand to view detailed analysis including range breakdowns,
            equity calculations, and suggested strategies.
          </p>
          <div className="mt-4 p-8 text-center text-gray-500">
            No hand selected — upload or paste a hand history above.
          </div>
        </section>
      </div>
    </div>
  );
}
