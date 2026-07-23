-- PromptForge AI -- Smart History Search (FTS4)
-- Adds a full-text search index over prompt_history.original_text and
-- enhanced_text.
--
-- NOTE ON FTS5 VS FTS4: The original plan called for FTS5. Verified directly
-- against the bundled sql.js WASM build (PRAGMA compile_options) that FTS5
-- is NOT compiled in (ENABLE_FTS3/ENABLE_FTS3_PARENTHESIS only). FTS4 IS
-- available in this build and provides the same MATCH query syntax and real
-- inverted-index search -- the only difference is no native bm25() ranking
-- function, so ranking uses a simple match-count heuristic computed in
-- HistoryService instead. See docs/new_features_plan.md Amendments for the
-- full escalation record.
--
-- NOTE ON SYNC STRATEGY -- NO DB TRIGGERS: Same lesson as
-- migrations/003_personas.sql: the migration runner (runMigrations() in
-- src/services/db/database.ts) splits every .sql file on every literal
-- semicolon and executes fragments independently, silently catching and
-- warning on failures rather than throwing. This breaks ANY multi-statement
-- trigger body, and even single-statement CREATE TRIGGER ... BEGIN X END
-- bodies get split into the trigger header/body and a dangling END
-- fragment (verified directly). Keeping prompt_history_fts in sync with
-- prompt_history is therefore done at the application layer in
-- HistoryService (create()/deleteByIds()/deleteAll()) rather than via
-- triggers.

CREATE VIRTUAL TABLE IF NOT EXISTS prompt_history_fts USING fts4(
  original_text,
  enhanced_text,
  content='prompt_history'
);

INSERT INTO prompt_history_fts (docid, original_text, enhanced_text) SELECT rowid, original_text, enhanced_text FROM prompt_history;
