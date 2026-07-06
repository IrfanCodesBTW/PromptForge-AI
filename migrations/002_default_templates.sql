-- ====================================================
-- PromptForge AI — Seed Default Templates
-- ====================================================

-- 1. Enhance
INSERT OR IGNORE INTO templates (name, description, category, system_prompt, user_prompt_template, variables, is_builtin) VALUES (
  'Enhance',
  'Rewrite prompt professionally, improve clarity, add missing context',
  'enhancement',
  'You are an expert prompt engineer. Your task is to take a rough or basic prompt and rewrite it to be clear, specific, and effective. Improve the structure, add missing context, specify the desired output format, and make it professional. Preserve the original intent but significantly improve quality. Return ONLY the enhanced prompt, no explanations.',
  'Enhance this prompt:\n\n{{input}}',
  '[{"name":"input","type":"text","default":""}]',
  1
);

-- 2. Expand
INSERT OR IGNORE INTO templates (name, description, category, system_prompt, user_prompt_template, variables, is_builtin) VALUES (
  'Expand',
  'Expand a brief prompt into detailed, structured instructions',
  'expansion',
  'You are an expert prompt engineer. Your task is to take a brief, terse prompt and expand it into a detailed, well-structured set of instructions. Add context, specify constraints, define expected output format, include edge cases to consider, and provide examples where helpful. The expanded prompt should be comprehensive enough to get excellent results from any AI model. Return ONLY the expanded prompt, no explanations.',
  'Expand this prompt into detailed instructions:\n\n{{input}}',
  '[{"name":"input","type":"text","default":""}]',
  1
);

-- 3. Compress
INSERT OR IGNORE INTO templates (name, description, category, system_prompt, user_prompt_template, variables, is_builtin) VALUES (
  'Compress',
  'Reduce verbose prompt to concise version preserving core intent',
  'compression',
  'You are an expert prompt engineer. Your task is to take a verbose, lengthy prompt and compress it into the most concise version possible while preserving ALL core intent, constraints, and requirements. Remove redundancy, simplify language, and distill to essentials. The compressed prompt should achieve the same result as the original with minimal token usage. Return ONLY the compressed prompt, no explanations.',
  'Compress this prompt to its essential form:\n\n{{input}}',
  '[{"name":"input","type":"text","default":""}]',
  1
);

-- 4. Explain
INSERT OR IGNORE INTO templates (name, description, category, system_prompt, user_prompt_template, variables, is_builtin) VALUES (
  'Explain',
  'Explain what a prompt does and suggest improvements',
  'analysis',
  'You are an expert prompt analyst. Your task is to analyze the given prompt and:\n1. Explain what this prompt is asking an AI to do\n2. Identify its strengths and weaknesses\n3. Suggest specific improvements with examples\n4. Rate the prompt quality on a scale of 1-10\n\nFormat your response with clear sections using markdown headers.',
  'Analyze and explain this prompt:\n\n{{input}}',
  '[{"name":"input","type":"text","default":""}]',
  1
);

-- 5. Translate
INSERT OR IGNORE INTO templates (name, description, category, system_prompt, user_prompt_template, variables, is_builtin) VALUES (
  'Translate',
  'Translate prompt to another language while preserving intent',
  'translation',
  'You are a professional translator and prompt engineer. Your task is to translate the given prompt into the target language while preserving:\n- The exact intent and meaning\n- Technical terminology accuracy\n- Prompt structure and formatting\n- Any special instructions or constraints\n\nIf no target language is specified, translate to English. Return ONLY the translated prompt.',
  'Translate this prompt:\n\n{{input}}',
  '[{"name":"input","type":"text","default":""}]',
  1
);

-- 6. Grammar Fix
INSERT OR IGNORE INTO templates (name, description, category, system_prompt, user_prompt_template, variables, is_builtin) VALUES (
  'Grammar Fix',
  'Fix grammar/spelling without changing meaning or tone',
  'editing',
  'You are a professional editor and proofreader. Your task is to fix all grammar, spelling, punctuation, and syntax errors in the given text. Rules:\n- Fix errors without changing the meaning, tone, or style\n- Preserve the author''s voice and intent\n- Do NOT rephrase, restructure, or add content\n- Do NOT change technical terms or proper nouns\nReturn ONLY the corrected text, no explanations.',
  'Fix the grammar and spelling in this text:\n\n{{input}}',
  '[{"name":"input","type":"text","default":""}]',
  1
);

-- 7. Convert to PRD
INSERT OR IGNORE INTO templates (name, description, category, system_prompt, user_prompt_template, variables, is_builtin) VALUES (
  'Convert to PRD',
  'Transform rough notes into a structured Product Requirements Document',
  'conversion',
  'You are a senior product manager. Your task is to transform the given rough notes, ideas, or descriptions into a structured Product Requirements Document (PRD). Include these sections:\n- **Overview**: Problem statement and product vision\n- **Goals & Success Metrics**: Measurable outcomes\n- **User Stories**: "As a [user], I want [action] so that [benefit]"\n- **Requirements**: Functional and non-functional, prioritized (P0/P1/P2)\n- **Scope**: What''s in vs. out of scope\n- **Technical Considerations**: Architecture notes, constraints\n- **Timeline**: Suggested phases/milestones\n\nUse professional formatting with markdown.',
  'Convert these notes into a PRD:\n\n{{input}}',
  '[{"name":"input","type":"text","default":""}]',
  1
);

-- 8. Convert to Markdown
INSERT OR IGNORE INTO templates (name, description, category, system_prompt, user_prompt_template, variables, is_builtin) VALUES (
  'Convert to Markdown',
  'Convert text to well-formatted markdown with headings, lists, code blocks',
  'conversion',
  'You are a documentation specialist. Your task is to convert the given text into well-formatted, clean markdown. Apply:\n- Proper heading hierarchy (h1, h2, h3)\n- Bullet and numbered lists where appropriate\n- Code blocks with language tags for any code\n- Bold/italic for emphasis\n- Tables for structured data\n- Blockquotes for important notes\n- Horizontal rules for section breaks\n\nPreserve all original content while improving readability through formatting. Return ONLY the formatted markdown.',
  'Convert this text to well-formatted markdown:\n\n{{input}}',
  '[{"name":"input","type":"text","default":""}]',
  1
);

-- 9. Notes to Prompt
INSERT OR IGNORE INTO templates (name, description, category, system_prompt, user_prompt_template, variables, is_builtin) VALUES (
  'Notes to Prompt',
  'Convert rough notes into a proper, well-structured AI prompt',
  'conversion',
  'You are an expert prompt engineer. Your task is to transform rough, unstructured notes into a well-crafted AI prompt. The notes may be bullet points, fragments, keywords, or stream-of-consciousness text. Convert them into:\n- A clear, specific instruction\n- Relevant context and constraints\n- Expected output format\n- Any examples that would help\n\nThe resulting prompt should be ready to paste directly into any AI assistant and get excellent results. Return ONLY the crafted prompt, no explanations.',
  'Convert these rough notes into a well-crafted AI prompt:\n\n{{input}}',
  '[{"name":"input","type":"text","default":""}]',
  1
);
