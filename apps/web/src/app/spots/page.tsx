"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StrategyCard } from "@/components/ui/StrategyCard";
import { StrategyHeatmap } from "@/components/ui/StrategyHeatmap";

type Position = "BTN" | "SB" | "BB" | "CO" | "MP" | "UTG";
type BoardType = "dry" | "wet" | "paired" | "rainbow" | "monochrome";

interface CommunitySpot {
  id: string;
  board: string;
  boardType: BoardType;
  position: Position;
  potSize: number;
  stackDepth: number;
  title: string;
  description: string;
  author: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  tags: string[];
  strategy: Record<string, { action: "raise" | "call" | "fold"; frequency: number; ev: number }>;
}

const MOCK_COMMUNITY_SPOTS: CommunitySpot[] = [
  {
    id: "1",
    board: "Kd7h2c",
    boardType: "dry",
    position: "BTN",
    potSize: 100,
    stackDepth: 100,
    title: "BTN vs BB Dry Flop Spot",
    description: "Standard continuation bet sizing on a dry K-high board. Good for learning polarised betting.",
    author: "GTOPro",
    createdAt: "2 hours ago",
    likes: 24,
    isLiked: false,
    tags: ["c-bet", "dry-board", "btns"],
    strategy: {
      "AA": { action: "raise", frequency: 1.0, ev: 0.85 },
      "KK": { action: "raise", frequency: 0.95, ev: 0.82 },
      "AKs": { action: "raise", frequency: 0.88, ev: 0.76 },
      "AKo": { action: "raise", frequency: 0.75, ev: 0.68 },
      "QQ": { action: "raise", frequency: 0.90, ev: 0.74 },
      "JJ": { action: "call", frequency: 0.65, ev: 0.58 },
      "TT": { action: "call", frequency: 0.55, ev: 0.52 },
      "99": { action: "call", frequency: 0.45, ev: 0.45 },
      "22": { action: "fold", frequency: 0.8, ev: 0.0 },
    },
  },
  {
    id: "2",
    board: "AhKs7d",
    boardType: "wet",
    position: "CO",
    potSize: 80,
    stackDepth: 120,
    title: "CO vs BTN 3-Way Pot",
    description: "Complex multiway spot with flush draws. Learn when to bet and when to check back.",
    author: "SolverMaster",
    createdAt: "5 hours ago",
    likes: 18,
    isLiked: true,
    tags: ["wet-board", "multiway", "flush-draw"],
    strategy: {
      "AA": { action: "raise", frequency: 1.0, ev: 0.88 },
      "KK": { action: "raise", frequency: 0.98, ev: 0.85 },
      "AKs": { action: "raise", frequency: 0.92, ev: 0.78 },
      "AKo": { action: "raise", frequency: 0.70, ev: 0.62 },
      "QQ": { action: "call", frequency: 0.60, ev: 0.55 },
      "JJ": { action: "fold", frequency: 0.55, ev: 0.0 },
      "TT": { action: "fold", frequency: 0.60, ev: 0.0 },
    },
  },
  {
    id: "3",
    board: "8c8s4d",
    boardType: "paired",
    position: "BB",
    potSize: 150,
    stackDepth: 80,
    title: "Set Over Set Cooler",
    description: "Paired board scenario. Important for understanding set mining and facing raises.",
    author: "ICMWizard",
    createdAt: "1 day ago",
    likes: 42,
    isLiked: false,
    tags: ["paired-board", "cooler", "set-mining"],
    strategy: {
      "AA": { action: "raise", frequency: 1.0, ev: 0.90 },
      "KK": { action: "raise", frequency: 0.95, ev: 0.86 },
      "QQ": { action: "raise", frequency: 0.85, ev: 0.78 },
      "JJ": { action: "call", frequency: 0.70, ev: 0.65 },
      "88": { action: "fold", frequency: 0.75, ev: 0.0 },
      "77": { action: "fold", frequency: 0.70, ev: 0.0 },
    },
  },
  {
    id: "4",
    board: "QhJh2h",
    boardType: "wet",
    position: "BTN",
    potSize: 60,
    stackDepth: 100,
    title: "Flush Draw Board",
    description: "Monotone board with flush potential. Great for learning draw-heavy board strategy.",
    author: "PostflopPro",
    createdAt: "2 days ago",
    likes: 31,
    isLiked: false,
    tags: ["flush-draw", "monotone", "draw-heavy"],
    strategy: {
      "AA": { action: "raise", frequency: 0.85, ev: 0.75 },
      "KK": { action: "raise", frequency: 0.80, ev: 0.72 },
      "AKs": { action: "raise", frequency: 0.75, ev: 0.68 },
      "AKo": { action: "call", frequency: 0.55, ev: 0.48 },
      "QQ": { action: "raise", frequency: 0.70, ev: 0.62 },
      "JJ": { action: "call", frequency: 0.65, ev: 0.58 },
      "TT": { action: "fold", frequency: 0.60, ev: 0.0 },
    },
  },
  {
    id: "5",
    board: "AcKc2d",
    boardType: "dry",
    position: "SB",
    potSize: 120,
    stackDepth: 150,
    title: "Double Broadway Dry",
    description: "AAC-2 texture. Classic dry board for value betting with premium hands.",
    author: "GTOPro",
    createdAt: "3 days ago",
    likes: 15,
    isLiked: false,
    tags: ["dry-board", "broadway", "value-bet"],
    strategy: {
      "AA": { action: "raise", frequency: 1.0, ev: 0.92 },
      "KK": { action: "raise", frequency: 1.0, ev: 0.90 },
      "QQ": { action: "raise", frequency: 0.88, ev: 0.78 },
      "JJ": { action: "raise", frequency: 0.75, ev: 0.65 },
      "TT": { action: "call", frequency: 0.50, ev: 0.42 },
      "99": { action: "fold", frequency: 0.55, ev: 0.0 },
    },
  },
  {
    id: "6",
    board: "7s6s5d",
    boardType: "wet",
    position: "CO",
    potSize: 90,
    stackDepth: 100,
    title: "Connected Board Stack-off",
    description: "Mid-connected 7-6-5 board. Learn when to stack off with straight draws.",
    author: "SolverMaster",
    createdAt: "4 days ago",
    likes: 28,
    isLiked: true,
    tags: ["connected", "straight-draw", "stack-off"],
    strategy: {
      "AA": { action: "raise", frequency: 0.90, ev: 0.82 },
      "KK": { action: "raise", frequency: 0.85, ev: 0.78 },
      "AKs": { action: "raise", frequency: 0.80, ev: 0.72 },
      "AKo": { action: "call", frequency: 0.60, ev: 0.52 },
      "88": { action: "call", frequency: 0.55, ev: 0.48 },
      "77": { action: "call", frequency: 0.70, ev: 0.62 },
      "66": { action: "fold", frequency: 0.45, ev: 0.0 },
    },
  },
];

export default function SpotsPage() {
  const [spots, setSpots] = useState<CommunitySpot[]>(MOCK_COMMUNITY_SPOTS);
  const [filterPosition, setFilterPosition] = useState<Position | "all">("all");
  const [filterBoardType, setFilterBoardType] = useState<BoardType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpot, setSelectedSpot] = useState<CommunitySpot | null>(MOCK_COMMUNITY_SPOTS[0]);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const handleLike = (spotId: string) => {
    setSpots((prev) =>
      prev.map((spot) =>
        spot.id === spotId
          ? { ...spot, isLiked: !spot.isLiked, likes: spot.isLiked ? spot.likes - 1 : spot.likes + 1 }
          : spot
      )
    );
    if (selectedSpot?.id === spotId) {
      setSelectedSpot((prev) =>
        prev
          ? {
              ...prev,
              isLiked: !prev.isLiked,
              likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
            }
          : null
      );
    }
  };

  const filteredSpots = spots
    .filter((spot) => {
      if (filterPosition !== "all" && spot.position !== filterPosition) return false;
      if (filterBoardType !== "all" && spot.boardType !== filterBoardType) return false;
      if (searchQuery && !spot.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.likes - a.likes;
      return 0;
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-poker-gold">Community Spots</h1>
          <p className="text-gray-400 mt-1">Share and learn from shared GTO strategy spots</p>
        </div>
        <button className="px-4 py-2 bg-poker-gold text-gray-900 rounded-lg font-semibold hover:opacity-90 transition-opacity">
          + Share New Spot
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <div>
            <div className="text-lg font-bold text-white">{spots.length}</div>
            <div className="text-xs text-gray-400">Total Spots</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">❤️</span>
          <div>
            <div className="text-lg font-bold text-white">{spots.reduce((sum, s) => sum + s.likes, 0)}</div>
            <div className="text-xs text-gray-400">Total Likes</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">👥</span>
          <div>
            <div className="text-lg font-bold text-white">{new Set(spots.map((s) => s.author)).size}</div>
            <div className="text-xs text-gray-400">Contributors</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "recent" | "popular")}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search spots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Position</label>
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value as Position | "all")}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Positions</option>
            <option value="BTN">Button</option>
            <option value="SB">Small Blind</option>
            <option value="BB">Big Blind</option>
            <option value="CO">Cutoff</option>
            <option value="MP">Middle Position</option>
            <option value="UTG">UTG</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Board Type</label>
          <select
            value={filterBoardType}
            onChange={(e) => setFilterBoardType(e.target.value as BoardType | "all")}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="dry">Dry</option>
            <option value="wet">Wet</option>
            <option value="paired">Paired</option>
            <option value="rainbow">Rainbow</option>
            <option value="monochrome">Monochrome</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Spots List */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Shared Strategy Spots</h2>
          <div className="space-y-4">
            {filteredSpots.map((spot) => (
              <button
                key={spot.id}
                onClick={() => setSelectedSpot(spot)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all",
                  selectedSpot?.id === spot.id
                    ? "border-poker-gold bg-poker-gold/10"
                    : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold text-white">{spot.board}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-poker-gold/20 text-poker-gold">
                        {spot.position}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400 capitalize">
                        {spot.boardType}
                      </span>
                    </div>
                    <h3 className="font-medium text-white mb-1">{spot.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-1">{spot.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">by {spot.author}</span>
                      <span className="text-xs text-gray-500">·</span>
                      <span className="text-xs text-gray-500">{spot.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(spot.id);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors",
                        spot.isLiked
                          ? "text-red-400 bg-red-400/10"
                          : "text-gray-400 hover:text-red-400"
                      )}
                    >
                      <span>❤️</span>
                      <span>{spot.likes}</span>
                    </button>
                    <div className="flex gap-1">
                      {spot.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-gray-800 text-gray-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Spot Detail */}
        <div className="space-y-6">
          {selectedSpot ? (
            <>
              <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{selectedSpot.title}</h3>
                  <button
                    onClick={() => handleLike(selectedSpot.id)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors",
                      selectedSpot.isLiked
                        ? "text-red-400 bg-red-400/10 border border-red-400/30"
                        : "text-gray-400 bg-gray-800 border border-gray-700 hover:text-red-400"
                    )}
                  >
                    <span>❤️</span>
                    <span>{selectedSpot.likes}</span>
                  </button>
                </div>

                <p className="text-gray-300 mb-4">{selectedSpot.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedSpot.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span>by <span className="text-white">{selectedSpot.author}</span></span>
                  <span>·</span>
                  <span>{selectedSpot.createdAt}</span>
                </div>

                <StrategyCard
                  board={selectedSpot.board}
                  potSize={selectedSpot.potSize}
                  stackDepth={selectedSpot.stackDepth}
                  position={selectedSpot.position}
                />
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Strategy Heatmap</h4>
                <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-4 overflow-x-auto">
                  <StrategyHeatmap
                    strategy={selectedSpot.strategy}
                    board={selectedSpot.board}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                  Practice This Spot
                </button>
                <button className="py-2 px-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors border border-gray-700">
                  Share
                </button>
              </div>
            </>
          ) : (
            <div className="border border-gray-800 rounded-lg p-8 text-center bg-gray-900/50">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-gray-400">Select a spot to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
