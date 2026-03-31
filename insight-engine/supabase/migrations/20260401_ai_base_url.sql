-- AI provider configs 新增 base_url 欄位
-- 支援 Ollama（http://localhost:11434/v1）、Qwen（https://dashscope.aliyuncs.com/compatible-mode/v1）、任何 OpenAI-compatible endpoint

ALTER TABLE ai_provider_configs ADD COLUMN IF NOT EXISTS base_url TEXT;

COMMENT ON COLUMN ai_provider_configs.base_url IS 'Custom API endpoint for OpenAI-compatible providers (Ollama, Qwen, etc.). NULL = use OpenAI default.';
