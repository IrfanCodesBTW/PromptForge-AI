-- ====================================================
-- PromptForge AI — Initial Schema Migration
-- ====================================================
-- Creates all core tables, indexes, FTS, and default data.

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  variables TEXT DEFAULT '[]',
  is_builtin INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Providers
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('local', 'cloud')),
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT,
  default_model TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  config TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Prompt History
CREATE TABLE IF NOT EXISTS prompt_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  original_text TEXT NOT NULL,
  enhanced_text TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  template_id TEXT REFERENCES templates(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'general',
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  source_app TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('string', 'number', 'boolean', 'json')),
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Hotkeys
CREATE TABLE IF NOT EXISTS hotkeys (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  action TEXT NOT NULL UNIQUE,
  keybinding TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Prompt-Tags junction
CREATE TABLE IF NOT EXISTS prompt_tags (
  prompt_id TEXT NOT NULL REFERENCES prompt_history(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, tag_id)
);

-- ========== INDEXES ==========

CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON prompt_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_history_category ON prompt_history(category);
CREATE INDEX IF NOT EXISTS idx_prompt_history_provider ON prompt_history(provider);
CREATE INDEX IF NOT EXISTS idx_prompt_history_is_favorite ON prompt_history(is_favorite) WHERE is_favorite = 1;
CREATE INDEX IF NOT EXISTS idx_prompt_history_template_id ON prompt_history(template_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_providers_is_active ON providers(is_active) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_providers_priority ON providers(priority DESC);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag_id ON prompt_tags(tag_id);



-- ========== DEFAULT DATA ==========

-- Default settings
INSERT OR IGNORE INTO settings (key, value, type, category) VALUES
  ('theme', 'system', 'string', 'appearance'),
  ('data_retention_days', '-1', 'number', 'privacy'),
  ('startup_minimize', 'true', 'boolean', 'general'),
  ('clipboard_auto_paste', 'true', 'boolean', 'general'),
  ('analytics_enabled', 'false', 'boolean', 'privacy'),
  ('defaultProvider', 'ollama', 'string', 'general'),
  ('defaultModel', 'llama3.1', 'string', 'general'),
  ('temperature', '0.7', 'number', 'general'),
  ('maxTokens', '2048', 'number', 'general'),
  ('notifications', 'on', 'string', 'general');

-- Default hotkeys
INSERT OR IGNORE INTO hotkeys (id, action, keybinding) VALUES
  (lower(hex(randomblob(16))), 'enhance', 'Ctrl+Shift+E'),
  (lower(hex(randomblob(16))), 'expand', 'Ctrl+Shift+X'),
  (lower(hex(randomblob(16))), 'compress', 'Ctrl+Shift+K'),
  (lower(hex(randomblob(16))), 'palette', 'Ctrl+Shift+P'),
  (lower(hex(randomblob(16))), 'explain', 'Ctrl+Shift+/'),
  (lower(hex(randomblob(16))), 'translate', 'Ctrl+Shift+T'),
  (lower(hex(randomblob(16))), 'grammar-fix', 'Ctrl+Shift+G');

-- Default provider (Ollama)
INSERT OR IGNORE INTO providers (id, name, type, base_url, default_model, is_active, priority) VALUES
  (lower(hex(randomblob(16))), 'ollama', 'local', 'http://localhost:11434', 'llama3.1', 1, 100);
