-- PromptForge AI -- Persona Profiles
-- Adds a personas table plus a persona_override_allowed column on templates.
-- NOTE: This file avoids semicolons inside comments entirely. The migration
-- runner (runMigrations() in src/services/db/database.ts) splits this file
-- on every semicolon character and executes each fragment independently, so
-- any semicolon anywhere (including inside a comment) creates a new
-- fragment boundary. Multi-statement trigger bodies (BEGIN ... END with an
-- internal semicolon) are NOT safe with this runner for the same reason --
-- see personaService.ts for where single-default enforcement actually lives.

CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  tone TEXT NOT NULL CHECK (tone IN ('professional', 'casual', 'technical', 'creative', 'formal')),
  format_rules TEXT,
  system_prompt_injection TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  is_builtin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_personas_is_default ON personas(is_default) WHERE is_default = 1;

CREATE INDEX IF NOT EXISTS idx_personas_is_builtin ON personas(is_builtin) WHERE is_builtin = 1;

ALTER TABLE templates ADD COLUMN persona_override_allowed INTEGER DEFAULT 1;

UPDATE templates SET persona_override_allowed = 0 WHERE is_builtin = 1;

INSERT OR IGNORE INTO personas (id, name, description, tone, format_rules, system_prompt_injection, is_default, is_builtin) VALUES (
  lower(hex(randomblob(16))),
  'General',
  'Neutral, balanced tone suitable for any context. The default persona.',
  'professional',
  'Use clear, plain language. No strong stylistic bias.',
  'Respond in a neutral, professional tone without strong stylistic embellishment.',
  1,
  1
);

INSERT OR IGNORE INTO personas (id, name, description, tone, format_rules, system_prompt_injection, is_default, is_builtin) VALUES (
  lower(hex(randomblob(16))),
  'Developer',
  'Technical and concise. Prefers code blocks and precise terminology.',
  'technical',
  'Use code blocks for any code or commands. Prefer bullet points over prose. Be precise and avoid marketing language.',
  'You are writing for a senior software engineer audience. Be technical, concise, and precise. Use code blocks (with language tags) for any code, commands, or config. Avoid unnecessary preamble or marketing language.',
  0,
  1
);

INSERT OR IGNORE INTO personas (id, name, description, tone, format_rules, system_prompt_injection, is_default, is_builtin) VALUES (
  lower(hex(randomblob(16))),
  'Executive',
  'Formal, action-oriented, structured with bullet points and clear outcomes.',
  'formal',
  'Lead with the bottom line. Use bullet points for key items. Avoid jargon. Be concise and decisive.',
  'You are writing for a senior executive audience. Be formal, structured, and action-oriented. Lead with the bottom-line conclusion, then supporting bullet points. Avoid jargon and unnecessary detail.',
  0,
  1
);

INSERT OR IGNORE INTO personas (id, name, description, tone, format_rules, system_prompt_injection, is_default, is_builtin) VALUES (
  lower(hex(randomblob(16))),
  'Creative',
  'Expressive and varied in structure, tone, and word choice.',
  'creative',
  'Vary sentence structure and length. Use vivid, evocative language where appropriate. Avoid formulaic phrasing.',
  'Write with an expressive, creative voice. Vary sentence structure and rhythm. Use vivid, evocative language where it serves the content, while still respecting the requested task.',
  0,
  1
);

INSERT OR IGNORE INTO personas (id, name, description, tone, format_rules, system_prompt_injection, is_default, is_builtin) VALUES (
  lower(hex(randomblob(16))),
  'Social',
  'Casual, punchy, and aware of social media platform conventions.',
  'casual',
  'Keep sentences short and punchy. Use an informal, conversational tone. Avoid corporate jargon.',
  'Write in a casual, punchy, conversational tone suitable for social media. Keep sentences short. Avoid corporate jargon and overly formal phrasing.',
  0,
  1
);
