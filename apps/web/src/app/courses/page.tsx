"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Difficulty = "beginner" | "intermediate" | "advanced";
type Category = "preflop" | "postflop" | "icm" | "exploits";

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: Category;
  lessons: number;
  duration: string;
  progress: number;
  image: string;
  author: string;
  lessonsList: { title: string; duration: string; completed: boolean }[];
}

const MOCK_COURSES: Course[] = [
  {
    id: "preflop-basics",
    title: "Preflop Fundamentals",
    description: "Learn optimal preflop strategy for all positions. Master opening ranges, 3-betting, and facing opens.",
    difficulty: "beginner",
    category: "preflop",
    lessons: 12,
    duration: "2h 30m",
    progress: 75,
    image: "🎯",
    author: "GTO Wizard",
    lessonsList: [
      { title: "Understanding Position", duration: "10m", completed: true },
      { title: "Opening Ranges by Position", duration: "15m", completed: true },
      { title: "Hand Grouping", duration: "12m", completed: true },
      { title: "3-Betting Strategy", duration: "18m", completed: false },
      { title: "4-Betting & 5-Betting", duration: "15m", completed: false },
      { title: "Defending the Big Blind", duration: "20m", completed: false },
      { title: "Isolation Raises", duration: "12m", completed: false },
      { title: "Squeezing", duration: "10m", completed: false },
      { title: "Multiway Pots", duration: "15m", completed: false },
      { title: "Short Stack Adjustments", duration: "12m", completed: false },
      { title: "Deep Stack Play", duration: "18m", completed: false },
      { title: "Live Table Adjustments", duration: "15m", completed: false },
    ],
  },
  {
    id: "postflop-dry",
    title: "Dry Board Mastery",
    description: "Master strategy on dry, static boards. Learn when to bet, check, and extract value.",
    difficulty: "beginner",
    category: "postflop",
    lessons: 8,
    duration: "1h 45m",
    progress: 30,
    image: "📊",
    author: "GTO Wizard",
    lessonsList: [
      { title: "Reading Board Texture", duration: "12m", completed: true },
      { title: "Dry Flop Strategy", duration: "15m", completed: true },
      { title: "Donk Betting on Dry Boards", duration: "10m", completed: false },
      { title: "Checking Back Ranges", duration: "15m", completed: false },
      { title: "Turn & River Play", duration: "18m", completed: false },
      { title: " extracting Value", duration: "12m", completed: false },
      { title: "Bluffing Dry Boards", duration: "10m", completed: false },
      { title: "Mixed Strategies", duration: "15m", completed: false },
    ],
  },
  {
    id: "icm-essentials",
    title: "ICM Essentials",
    description: "Master Independent Chip Model calculations. Make mathematically optimal tournament decisions.",
    difficulty: "intermediate",
    category: "icm",
    lessons: 10,
    duration: "2h 15m",
    progress: 0,
    image: "🏆",
    author: "GTO Wizard",
    lessonsList: [
      { title: "What is ICM?", duration: "12m", completed: false },
      { title: "Chip Value in Tournaments", duration: "15m", completed: false },
      { title: "Bubble Play Fundamentals", duration: "18m", completed: false },
      { title: "Final Table Strategy", duration: "20m", completed: false },
      { title: "ICM Pressure & Calling Ranges", duration: "15m", completed: false },
      { title: "ICM in Satellite Tournaments", duration: "12m", completed: false },
      { title: "Push-Fold Calculator Use", duration: "10m", completed: false },
      { title: "Adjusting for Overlay", duration: "10m", completed: false },
      { title: "ICM vs. Future Town Simulation", duration: "15m", completed: false },
      { title: "Live Tournament ICM", duration: "10m", completed: false },
    ],
  },
  {
    id: "exploit-adjustments",
    title: "Exploiting Player Tendencies",
    description: "Learn to identify and exploit common player mistakes and tendencies.",
    difficulty: "advanced",
    category: "exploits",
    lessons: 15,
    duration: "3h 30m",
    progress: 0,
    image: "🎓",
    author: "GTO Wizard",
    lessonsList: [
      { title: "Identifying Player Types", duration: "15m", completed: false },
      { title: "Exploiting Loose Passives", duration: "18m", completed: false },
      { title: "Exploiting Tight Aggressive", duration: "15m", completed: false },
      { title: "Exploiting Calling Stations", duration: "12m", completed: false },
      { title: "Exploiting Nit Players", duration: "10m", completed: false },
      { title: "Bluffing Fish Players", duration: "12m", completed: false },
      { title: "Adjusting to 3-Bet Pots", duration: "15m", completed: false },
      { title: "4-Bet Bluffing", duration: "12m", completed: false },
      { title: "Float Betting", duration: "15m", completed: false },
      { title: "Delayed Continuation Bets", duration: "12m", completed: false },
      { title: "River Bluffing", duration: "18m", completed: false },
      { title: "Thin Value Betting", duration: "12m", completed: false },
      { title: "Pot Control", duration: "10m", completed: false },
      { title: "Mixed Strategy Exploits", duration: "15m", completed: false },
      { title: "Balancing Against Good Players", duration: "20m", completed: false },
    ],
  },
  {
    id: "wet-boards",
    title: "Wet Board Dynamics",
    description: "Navigate complex wet boards with draws. Learn optimal strategy with flush and straight draws.",
    difficulty: "intermediate",
    category: "postflop",
    lessons: 10,
    duration: "2h 20m",
    progress: 0,
    image: "🌧️",
    author: "GTO Wizard",
    lessonsList: [
      { title: "Identifying Wet Board Textures", duration: "12m", completed: false },
      { title: "Draw heavy Flop Strategy", duration: "18m", completed: false },
      { title: "Checking Ranges on Wet Boards", duration: "15m", completed: false },
      { title: "Betting with Draws", duration: "12m", completed: false },
      { title: "Protection Betting", duration: "10m", completed: false },
      { title: "Turn & River Draws", duration: "15m", completed: false },
      { title: "Overcards as Draws", duration: "12m", completed: false },
      { title: "Gutshot Straight Draws", duration: "10m", completed: false },
      { title: "Multi-Draw Strategy", duration: "15m", completed: false },
      { title: "Backdoor Draws", duration: "12m", completed: false },
    ],
  },
  {
    id: "live-tells",
    title: "Live Poker Tells",
    description: "Read opponents and exploit physical tells in live poker games.",
    difficulty: "beginner",
    category: "exploits",
    lessons: 6,
    duration: "1h 10m",
    progress: 0,
    image: "👀",
    author: "GTO Wizard",
    lessonsList: [
      { title: "Basic Hand Tells", duration: "12m", completed: false },
      { title: "Betting Pattern Tells", duration: "15m", completed: false },
      { title: "Time Tells", duration: "10m", completed: false },
      { title: "Chip Stacking Patterns", duration: "8m", completed: false },
      { title: "Body Language Basics", duration: "12m", completed: false },
      { title: "Combining Tells with GTO", duration: "15m", completed: false },
    ],
  },
];

const DIFFICULTY_COLORS = {
  beginner: "bg-green-500/20 text-green-400 border-green-500/30",
  intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  advanced: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CATEGORY_LABELS = {
  preflop: "Preflop",
  postflop: "Postflop",
  icm: "ICM",
  exploits: "Exploits",
};

export default function CoursesPage() {
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const filteredCourses = MOCK_COURSES.filter((course) => {
    if (filterDifficulty !== "all" && course.difficulty !== filterDifficulty) return false;
    if (filterCategory !== "all" && course.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-poker-gold">Pre-Built Courses</h1>
          <p className="text-gray-400 mt-1">Structured learning paths to master GTO poker</p>
        </div>
        <Link
          href="/train"
          className="px-4 py-2 bg-poker-gold text-gray-900 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Continue Training
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-poker-gold">6</div>
          <div className="text-sm text-gray-400">Available Courses</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">61</div>
          <div className="text-sm text-gray-400">Total Lessons</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">13.5h</div>
          <div className="text-sm text-gray-400">Total Content</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">17%</div>
          <div className="text-sm text-gray-400">Overall Progress</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Difficulty</label>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | "all")}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as Category | "all")}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Categories</option>
            <option value="preflop">Preflop</option>
            <option value="postflop">Postflop</option>
            <option value="icm">ICM</option>
            <option value="exploits">Exploits</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course List */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Available Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={cn(
                  "p-5 rounded-lg border bg-gray-900/50 text-left transition-all hover:scale-[1.02]",
                  selectedCourse?.id === course.id
                    ? "border-poker-gold"
                    : "border-gray-800 hover:border-gray-700"
                )}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{course.image}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{course.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{course.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs border capitalize",
                      DIFFICULTY_COLORS[course.difficulty]
                    )}
                  >
                    {course.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400">
                    {CATEGORY_LABELS[course.category]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {course.lessons} lessons · {course.duration}
                  </span>
                  <span className="text-poker-gold font-medium">{course.progress}%</span>
                </div>
                {course.progress > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-poker-gold transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Course Detail / Selected Course */}
        <div className="space-y-6">
          {selectedCourse ? (
            <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-4xl">{selectedCourse.image}</span>
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedCourse.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">by {selectedCourse.author}</p>
                </div>
              </div>

              <p className="text-gray-300 mb-4">{selectedCourse.description}</p>

              <div className="flex items-center gap-3 mb-6">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs border capitalize",
                    DIFFICULTY_COLORS[selectedCourse.difficulty]
                  )}
                >
                  {selectedCourse.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400">
                  {CATEGORY_LABELS[selectedCourse.category]}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Your Progress</span>
                  <span className="text-poker-gold font-medium">{selectedCourse.progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-poker-gold transition-all"
                    style={{ width: `${selectedCourse.progress}%` }}
                  />
                </div>
              </div>

              {/* Course Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{selectedCourse.lessons}</div>
                  <div className="text-gray-400">Lessons</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{selectedCourse.duration}</div>
                  <div className="text-gray-400">Duration</div>
                </div>
              </div>

              {/* Start/Continue Button */}
              <button
                className={cn(
                  "w-full py-3 px-4 rounded-lg font-semibold transition-all",
                  selectedCourse.progress > 0
                    ? "bg-poker-gold text-gray-900 hover:opacity-90"
                    : "bg-green-600 text-white hover:bg-green-700"
                )}
              >
                {selectedCourse.progress > 0 ? "Continue Course" : "Start Course"}
              </button>
            </div>
          ) : (
            <div className="border border-gray-800 rounded-lg p-8 text-center bg-gray-900/50">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-gray-400">Select a course to view details</p>
            </div>
          )}

          {/* Recent Activity / Quick Stats */}
          <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-6">
            <h4 className="text-lg font-semibold mb-4">Quick Stats</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Courses Started</span>
                <span className="font-medium text-white">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Lessons Completed</span>
                <span className="font-medium text-white">9 / 61</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Time Spent</span>
                <span className="font-medium text-white">1h 15m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Streak</span>
                <span className="font-medium text-green-400">3 days 🔥</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
