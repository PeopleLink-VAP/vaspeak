-- VASpeak SQLite Schema
-- Safe to run multiple times via IF NOT EXISTS guards.
-- Run with: node scripts/init-db.js

-- =====================
-- PROFILES
-- =====================
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    email_verified BOOLEAN DEFAULT 0,
    role TEXT DEFAULT 'user',          -- 'user' | 'admin'
    current_level TEXT DEFAULT 'general', -- 'general' | 'working_va'
    niche TEXT,                        -- 'ecommerce' | 'video_editor' | 'operations' etc.
    native_language TEXT DEFAULT 'vi',
    avatar_url TEXT,
    streak_count INTEGER DEFAULT 0,
    last_active_date TEXT,             -- ISO date string YYYY-MM-DD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- AUTH
-- =====================
CREATE TABLE IF NOT EXISTS auth_passwords (
    user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_verifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS magic_links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

-- =====================
-- CREDITS
-- =====================
CREATE TABLE IF NOT EXISTS user_credits (
    user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    monthly_allowance INTEGER DEFAULT 100,
    credits_used INTEGER DEFAULT 0,
    subscription_status TEXT DEFAULT 'free', -- 'free' | 'pro'
    reset_date TIMESTAMP
);

-- Audit log for credit spending & earning
CREATE TABLE IF NOT EXISTS credit_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL,            -- negative = spent, positive = earned
    reason TEXT NOT NULL,             -- 'roleplay', 'daily_bonus', 'milestone', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- LESSONS
-- =====================
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    day_number INTEGER NOT NULL,
    week_number INTEGER NOT NULL DEFAULT 1,
    week_theme TEXT,
    niche TEXT DEFAULT 'general',     -- 'general' | 'ecommerce' | 'video_editor' | etc.
    title TEXT NOT NULL,
    -- JSON array of 4 block objects: [{type, prompt, options, audio_script}]
    content TEXT NOT NULL DEFAULT '[]',
    is_published BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_day_niche ON lessons(day_number, niche);

-- =====================
-- USER PROGRESS
-- =====================
CREATE TABLE IF NOT EXISTS user_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
    -- JSON: {"block_1": true, "block_2": true, "block_3": false, "block_4": false}
    block_completions TEXT NOT NULL DEFAULT '{}',
    -- JSON: {"pronunciation": 85, "fluency": "good", "grammar_errors": [...]}
    simulation_scores TEXT NOT NULL DEFAULT '{}',
    stress_level INTEGER,              -- 1–3 (Anxious / Okay / Confident)
    reflection_notes TEXT,
    completed_at TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- =====================
-- VOCABULARY BANK
-- =====================
CREATE TABLE IF NOT EXISTS vocabulary_bank (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    definition TEXT,
    context_sentence TEXT,
    lesson_id TEXT,                    -- optional: which lesson this came from
    mastered BOOLEAN DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vocab_user ON vocabulary_bank(user_id);

-- =====================
-- NEWSLETTER / WAITLIST
-- =====================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'landing',     -- 'landing' | 'app' | etc.
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- ADMIN
-- =====================
CREATE TABLE IF NOT EXISTS blacklisted_domains (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    domain TEXT UNIQUE NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_feedback (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- TELEGRAM
-- =====================
CREATE TABLE IF NOT EXISTS telegram_links (
    user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    telegram_chat_id TEXT UNIQUE,
    telegram_username TEXT,
    link_token TEXT UNIQUE,
    linked_at TEXT,
    reminder_hour INTEGER DEFAULT 8,
    timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS telegram_challenges (
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    options TEXT NOT NULL,
    answered INTEGER DEFAULT 0,
    user_answer TEXT,
    answered_at TEXT,
    correct INTEGER,
    credits_earned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, word)
);

CREATE TABLE IF NOT EXISTS telegram_messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    telegram_chat_id TEXT NOT NULL,
    direction TEXT NOT NULL,           -- 'in' | 'out'
    message_text TEXT,
    message_type TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
