"use client";

import Link from "next/link";

interface Props {
  variantKey: string;
  variantName: string;
  variantCategory: string;
}

export default function VariantStubPage({ variantKey, variantName, variantCategory }: Props) {
  const categoryIcons: Record<string, string> = {
    flop: "🃏",
    stud: "♠️",
    draw: "🔄",
  };

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-lg mx-auto">
        <div className="text-6xl mb-6">{categoryIcons[variantCategory] || "🃏"}</div>
        <h1 className="text-3xl font-bold text-white mb-2">{variantName}</h1>
        <p className="text-gray-400 mb-2">
          <span className="inline-block px-2 py-0.5 rounded text-xs capitalize border bg-gray-800 text-gray-300 border-gray-700">
            {variantCategory}
          </span>
        </p>
        <div className="w-16 h-0.5 bg-poker-gold mx-auto my-6" />
        <p className="text-gray-500 mb-8">
          The equity calculator for <strong className="text-gray-300">{variantKey}</strong> is under development.
          In the meantime, you can explore this variant via the API or try other variant calculators.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/variants"
            className="px-5 py-2.5 rounded-lg font-semibold bg-poker-gold text-gray-900 hover:opacity-90 transition-opacity"
          >
            ← Back to Variants
          </Link>
          <Link
            href={`/api/v1/variants/${variantKey}`}
            className="px-5 py-2.5 rounded-lg font-semibold border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-all"
          >
            API Docs ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
