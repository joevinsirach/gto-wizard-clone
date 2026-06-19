"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Difficulty = "beginner" | "intermediate" | "advanced";

interface ApiLesson {
  id: string;
  title: string;
  content: string | null;
  content_type: string;
  duration_minutes: number;
  order_index: number;
  is_preview: boolean;
}

interface ApiCourseDetail {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  difficulty: Difficulty;
  category: string;
  duration_minutes: number;
  lesson_count: number;
  is_featured: boolean;
  tags: string[];
  author: string;
  lessons: ApiLesson[];
}

interface LessonProgress {
  lesson_id: string;
  status: string;
  progress_percent: number;
  completed_at: string | null;
}

interface CourseProgress {
  overall_progress: number;
  lessons_completed: number;
  total_lessons: number;
  lessons: LessonProgress[];
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
  tournament: "Tournament",
};

const CONTENT_TYPE_ICONS: Record<string, string> = {
  text: "📝",
  video: "🎬",
  quiz: "🧠",
  interactive: "🎮",
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function renderMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  return text.split("\n").map((line, i) => {
    if (line.startsWith("# ")) {
      return (
        <h1 key={i} className="text-xl font-bold text-white mt-4 mb-2">
          {line.replace("# ", "")}
        </h1>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={i} className="text-lg font-semibold text-gray-100 mt-4 mb-2">
          {line.replace("## ", "")}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3 key={i} className="text-base font-semibold text-gray-200 mt-3 mb-1">
          {line.replace("### ", "")}
        </h3>
      );
    }
    if (line.startsWith("- **") && line.endsWith("**")) {
      return (
        <p key={i} className="text-gray-300 ml-4 mb-1">
          • <strong className="text-white">{line.replace("- **", "").replace("**", "")}</strong>
        </p>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={i} className="text-gray-300 ml-4 list-disc mb-1">
          {line.replace("- ", "")}
        </li>
      );
    }
    if (line.startsWith("|") && line.includes("---")) {
      return null;
    }
    if (line.startsWith("|")) {
      return (
        <p key={i} className="text-gray-300 text-xs font-mono mb-1">
          {line}
        </p>
      );
    }
    if (line.trim() === "") {
      return <div key={i} className="h-2" />;
    }
    return (
      <p key={i} className="text-gray-300 mb-1 leading-relaxed">
        {line}
      </p>
    );
  });
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<ApiCourseDetail | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/courses/${courseId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Course not found");
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data: ApiCourseDetail = await res.json();
      setCourse(data);
      // Auto-select first lesson if available
      if (data.lessons && data.lessons.length > 0) {
        setActiveLessonId(data.lessons[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/courses/user/default/course/${courseId}/progress`);
      if (res.ok) {
        const data: CourseProgress = await res.json();
        setProgress(data);
      }
    } catch {
      // Progress fetch is non-critical
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
    fetchProgress();
  }, [fetchCourse, fetchProgress]);

  const handleCompleteLesson = async (lessonId: string) => {
    setCompleting(lessonId);
    try {
      const res = await fetch(
        `/api/v1/courses/user/default/course/${courseId}/lesson/${lessonId}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed", progress_percent: 100 }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchProgress();
    } catch (err) {
      console.error("Failed to complete lesson:", err);
    } finally {
      setCompleting(null);
    }
  };

  const activeLesson = course?.lessons.find((l) => l.id === activeLessonId);
  const completedCount = progress?.lessons_completed ?? 0;
  const totalLessons = course?.lessons.length ?? 0;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const isLessonCompleted = (lessonId: string) => {
    return progress?.lessons.some((lp) => lp.lesson_id === lessonId && lp.status === "completed") ?? false;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="text-4xl mb-4 animate-pulse">📚</div>
          <p className="text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16 border border-gray-800 rounded-lg">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">{error || "Course not found"}</p>
          <Link href="/courses" className="text-poker-gold hover:underline">
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/courses" className="hover:text-poker-gold transition-colors">
          Courses
        </Link>
        <span>›</span>
        <span className="text-gray-200 truncate">{course.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Header */}
          <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-4xl">
                {course.difficulty === "beginner" ? "🎯" : course.difficulty === "intermediate" ? "📊" : "🏆"}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{course.title}</h1>
                <p className="text-sm text-gray-400 mt-1">by {course.author}</p>
              </div>
            </div>

            {course.description && (
              <p className="text-gray-300 mb-4 leading-relaxed">{course.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={cn(
                  "px-2.5 py-1 rounded text-xs border capitalize",
                  DIFFICULTY_COLORS[course.difficulty]
                )}
              >
                {course.difficulty}
              </span>
              <span className="px-2.5 py-1 rounded text-xs bg-gray-800 text-gray-400">
                {CATEGORY_LABELS[course.category] || course.category}
              </span>
              {course.is_featured && (
                <span className="px-2.5 py-1 rounded text-xs bg-poker-gold/20 text-poker-gold border border-poker-gold/30">
                  ⭐ Featured
                </span>
              )}
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>{totalLessons} lessons</span>
              <span>{formatDuration(course.duration_minutes)}</span>
              {course.tags.length > 0 && (
                <div className="flex gap-1">
                  {course.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-800 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {totalLessons > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-medium">
                    {completedCount}/{totalLessons} lessons ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Active Lesson Content */}
          {activeLesson && (
            <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{activeLesson.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{CONTENT_TYPE_ICONS[activeLesson.content_type] || "📄"} {activeLesson.content_type}</span>
                    <span>{formatDuration(activeLesson.duration_minutes)}</span>
                    {activeLesson.is_preview && (
                      <span className="px-1.5 py-0.5 rounded bg-poker-gold/20 text-poker-gold text-[10px] uppercase font-semibold">
                        Preview
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isLessonCompleted(activeLesson.id) ? (
                    <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      ✓ Completed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCompleteLesson(activeLesson.id)}
                      disabled={completing === activeLesson.id}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {completing === activeLesson.id ? "Completing..." : "Mark Complete"}
                    </button>
                  )}
                </div>
              </div>

              {activeLesson.content ? (
                <div className="prose prose-invert prose-sm max-w-none border-t border-gray-800 pt-4">
                  {renderMarkdown(activeLesson.content)}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border-t border-gray-800">
                  <p>No content available for this lesson yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar — Lesson List */}
        <div className="space-y-6">
          <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              Lessons ({totalLessons})
            </h3>
            {course.lessons.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No lessons available</p>
            ) : (
              <div className="space-y-1">
                {course.lessons
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((lesson, idx) => {
                    const completed = isLessonCompleted(lesson.id);
                    const isActive = activeLessonId === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLessonId(lesson.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                          isActive
                            ? "bg-gray-800 border border-gray-700"
                            : "hover:bg-gray-800/50 border border-transparent"
                        )}
                      >
                        <span
                          className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium",
                            completed
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-gray-700 text-gray-300"
                          )}
                        >
                          {completed ? "✓" : idx + 1}
                        </span>
                        <span
                          className={cn(
                            "flex-1 text-sm truncate",
                            isActive ? "text-white font-medium" : "text-gray-300"
                          )}
                        >
                          {lesson.title}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {lesson.is_preview && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-poker-gold/20 text-poker-gold uppercase font-semibold">
                              Preview
                            </span>
                          )}
                          <span className="text-[10px] text-gray-500">
                            {CONTENT_TYPE_ICONS[lesson.content_type] || "📄"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              Quick Actions
            </h3>
            <Link
              href="/courses"
              className="block w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors text-center"
            >
              ← All Courses
            </Link>
            <Link
              href="/practice"
              className="block w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors text-center"
            >
              Practice Mode
            </Link>
            <Link
              href="/quiz"
              className="block w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors text-center"
            >
              Random Quiz
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
