"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { gtoTheme } from "@/styles/gto-tokens";

type Difficulty = "beginner" | "intermediate" | "advanced";
type Category = "preflop" | "postflop" | "icm" | "exploits";

interface ApiCourse {
  id: string;
  title: string;
  description: string;
  short_description: string;
  difficulty: Difficulty;
  category: Category;
  duration_minutes: number;
  lesson_count: number;
  is_featured: boolean;
  tags: string[];
  author: string;
}

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
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-400 border-green-500/30",
  intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  advanced: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  preflop: "Preflop",
  postflop: "Postflop",
  icm: "ICM",
  exploits: "Exploits",
};

const DIFFICULTY_ICONS: Record<string, string> = {
  beginner: "🎯",
  intermediate: "📊",
  advanced: "🏆",
};

const CATEGORY_ICONS: Record<string, string> = {
  preflop: "♠",
  postflop: "♣",
  icm: "💰",
  exploits: "🎓",
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function apiToCourse(api: ApiCourse): Course {
  return {
    id: api.id,
    title: api.title,
    description: api.description || api.short_description || "",
    difficulty: api.difficulty,
    category: api.category,
    lessons: api.lesson_count || 0,
    duration: formatDuration(api.duration_minutes || 0),
    progress: 0,
    image: DIFFICULTY_ICONS[api.difficulty] || "📚",
    author: api.author || "GTO Wizard",
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetch("/api/v1/courses")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const mapped = (data.courses || []).map(apiToCourse);
        setCourses(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch courses:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredCourses = courses.filter((course) => {
    if (filterDifficulty !== "all" && course.difficulty !== filterDifficulty) return false;
    if (filterCategory !== "all" && course.category !== filterCategory) return false;
    return true;
  });

  const totalLessons = courses.reduce((sum, c) => sum + c.lessons, 0);
  const totalDuration = courses.reduce((sum, c) => sum + parseInt(c.duration), 0);

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-poker-gold">{courses.length}</div>
          <div className="text-sm text-gray-400">Available Courses</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{totalLessons}</div>
          <div className="text-sm text-gray-400">Total Lessons</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {courses.reduce((sum, c) => sum + Math.round(parseInt(c.duration) / 60), 0)}h
          </div>
          <div className="text-sm text-gray-400">Total Content</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">0%</div>
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

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 animate-pulse">📚</div>
          <p className="text-gray-400">Loading courses...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 border border-gray-800 rounded-lg">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400">Failed to load courses: {error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Available Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  No courses match your filters.
                </div>
              ) : (
                filteredCourses.map((course) => (
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
                        {CATEGORY_LABELS[course.category] || course.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {course.lessons} lessons · {course.duration}
                      </span>
                      <span className="text-poker-gold font-medium">{course.progress}%</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Course Detail */}
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
                    {CATEGORY_LABELS[selectedCourse.category] || selectedCourse.category}
                  </span>
                </div>

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

                <button className="w-full py-3 px-4 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition-all">
                  Start Course
                </button>
              </div>
            ) : (
              <div className="border border-gray-800 rounded-lg p-8 text-center bg-gray-900/50">
                <div className="text-4xl mb-4">📚</div>
                <p className="text-gray-400">Select a course to view details</p>
              </div>
            )}

            <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-6">
              <h4 className="text-lg font-semibold mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Courses Available</span>
                  <span className="font-medium text-white">{courses.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Lessons</span>
                  <span className="font-medium text-white">{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Started</span>
                  <span className="font-medium text-white">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
