"""
Fix missing tables in the GTO Wizard database.
Run this to add tables that the API's init_db fallback doesn't create.
"""
import sqlite3, os, sys

db_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "gto_wizard.db")
db_path = os.path.abspath(db_path)
print(f"Fixing DB at: {db_path}")

conn = sqlite3.connect(db_path)
existing = set(r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall())

tables_to_create = {
    "strategies": """
        CREATE TABLE IF NOT EXISTS strategies (
            id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL,
            game_type TEXT DEFAULT 'nlh', players INTEGER DEFAULT 2,
            street TEXT DEFAULT 'preflop', board_hash TEXT DEFAULT '',
            bet_size REAL DEFAULT 0.0, stack_depth INTEGER,
            strategy_data TEXT, created_at TIMESTAMP, updated_at TIMESTAMP
        )
    """,
    "courses": """
        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
            short_description TEXT, game_type TEXT DEFAULT 'nlh',
            difficulty TEXT DEFAULT 'beginner', category TEXT DEFAULT 'preflop',
            duration_minutes INTEGER DEFAULT 0, lesson_count INTEGER DEFAULT 0,
            is_published INTEGER DEFAULT 0, is_featured INTEGER DEFAULT 0,
            prerequisites TEXT DEFAULT '[]', tags TEXT DEFAULT '[]',
            author TEXT DEFAULT 'GTO Wizard Team', created_at TIMESTAMP, updated_at TIMESTAMP
        )
    """,
    "lessons": """
        CREATE TABLE IF NOT EXISTS lessons (
            id TEXT PRIMARY KEY, course_id TEXT REFERENCES courses(id),
            title TEXT NOT NULL, description TEXT, content TEXT,
            order_index INTEGER DEFAULT 0, difficulty TEXT DEFAULT 'beginner',
            duration_minutes INTEGER DEFAULT 0, is_published INTEGER DEFAULT 0,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )
    """,
    "user_progress": """
        CREATE TABLE IF NOT EXISTS user_progress (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
            course_id TEXT REFERENCES courses(id),
            lesson_id TEXT REFERENCES lessons(id),
            completed INTEGER DEFAULT 0, score REAL DEFAULT 0.0,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )
    """,
    "quiz_submissions": """
        CREATE TABLE IF NOT EXISTS quiz_submissions (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, user_name TEXT,
            spot_id TEXT NOT NULL REFERENCES quiz_spots(id),
            selected_action TEXT NOT NULL, is_correct INTEGER DEFAULT 0,
            ev_loss REAL DEFAULT 0.0, time_taken_ms INTEGER,
            session_id TEXT, submitted_at TIMESTAMP
        )
    """,
    "user_stats": """
        CREATE TABLE IF NOT EXISTS user_stats (
            id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL, user_name TEXT,
            total_solves INTEGER DEFAULT 0, correct_count INTEGER DEFAULT 0,
            total_ev_loss REAL DEFAULT 0.0, current_streak INTEGER DEFAULT 0,
            max_streak INTEGER DEFAULT 0, points INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1, weak_spots TEXT DEFAULT '{}',
            accuracy_history TEXT, missed_spot_ids TEXT,
            last_updated TIMESTAMP, created_at TIMESTAMP
        )
    """,
    "review_spots": """
        CREATE TABLE IF NOT EXISTS review_spots (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
            spot_id TEXT NOT NULL REFERENCES quiz_spots(id),
            review_count INTEGER DEFAULT 1, last_reviewed_at TIMESTAMP,
            mastered INTEGER DEFAULT 0, created_at TIMESTAMP
        )
    """,
}

created = 0
for name, sql in tables_to_create.items():
    if name not in existing:
        conn.execute(sql)
        created += 1
        print(f"  + Created: {name}")

conn.commit()
final = set(r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall())
print(f"\nTotal tables: {len(final)} ({created} created)")
conn.close()
