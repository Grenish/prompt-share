export type ModelKind =
  | "text"
  | "image"
  | "multimodal"
  | "reasoning"
  | "audio"
  | "video"
  | "custom";

export type ModelInfo = {
  key: string;
  label: string;
  kind: ModelKind;
};

export const PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google" },
  { id: "meta", label: "Meta" },
  { id: "mistral", label: "Mistral" },
  { id: "cohere", label: "Cohere" },
  { id: "alibaba", label: "Alibaba" },
  { id: "baidu", label: "Baidu" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "zhipu", label: "Zhipu AI" },
  { id: "01-ai", label: "01.ai" },
  { id: "perplexity", label: "Perplexity" },
  { id: "xai", label: "xAI" },
  { id: "stability", label: "Stability AI" },
  { id: "midjourney", label: "Midjourney" },
  { id: "ideogram", label: "Ideogram" },
  { id: "playground", label: "Playground" },
  { id: "others", label: "Others" },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]["id"];

export const MODELS_BY_PROVIDER: Record<string, ModelInfo[]> = {
  openai: [
    { key: "gpt-5", label: "GPT-5", kind: "multimodal" },
    { key: "gpt-4.1", label: "GPT-4.1", kind: "multimodal" },
    { key: "gpt-4.1-mini", label: "GPT-4.1 Mini", kind: "multimodal" },
    { key: "gpt-4.1-nano", label: "GPT-4.1 Nano", kind: "multimodal" },
    { key: "o4-mini", label: "o4 Mini", kind: "reasoning" },
    { key: "gpt-image-1", label: "GPT Image 1", kind: "image" },
    { key: "sora", label: "Sora", kind: "video" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  anthropic: [
    { key: "opus-4.1", label: "Claude Opus 4.1", kind: "multimodal" },
    { key: "sonnet-4", label: "Claude Sonnet 4", kind: "multimodal" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  google: [
    { key: "gemini-2-5-pro", label: "Gemini 2.5 Pro", kind: "multimodal" },
    { key: "gemini-2-5-flash", label: "Gemini 2.5 Flash", kind: "multimodal" },
    {
      key: "gemini-2-5-flash-lite",
      label: "Gemini 2.5 Flash-Lite",
      kind: "multimodal",
    },
    {
      key: "gemini-2-5-flash-image",
      label: "Gemini 2.5 Flash Image",
      kind: "image",
    },
    { key: "veo-3", label: "Veo 3", kind: "video" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  meta: [
    { key: "llama-4-scout", label: "Llama 4 Scout", kind: "multimodal" },
    { key: "llama-4-maverick", label: "Llama 4 Maverick", kind: "multimodal" },
    { key: "llama-4-behemoth", label: "Llama 4 Behemoth", kind: "multimodal" },
    { key: "movie-gen", label: "Movie Gen", kind: "video" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  mistral: [
    { key: "mistral-large", label: "Mistral Large", kind: "multimodal" },
    { key: "mistral-medium-3", label: "Mistral Medium 3", kind: "multimodal" },
    {
      key: "mistral-small-3.1",
      label: "Mistral Small 3.1",
      kind: "multimodal",
    },
    { key: "magistral-medium", label: "Magistral Medium", kind: "multimodal" },
    { key: "magistral-small", label: "Magistral Small", kind: "multimodal" },
    { key: "codestral-22b", label: "Codestral 22B", kind: "text" },
    { key: "devstral-medium", label: "Devstral Medium", kind: "text" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  cohere: [
    {
      key: "command-a-03-2025",
      label: "Command A (03-2025)",
      kind: "multimodal",
    },
    {
      key: "command-r-plus-08-2024",
      label: "Command R+ (08-2024)",
      kind: "multimodal",
    },
    { key: "command-r-08-2024", label: "Command R (08-2024)", kind: "text" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  alibaba: [
    { key: "qwen3-max", label: "Qwen3-Max", kind: "multimodal" },
    { key: "qwen3-vl", label: "Qwen3-VL", kind: "multimodal" },
    { key: "qwen3-omni", label: "Qwen3-Omni", kind: "multimodal" },
    { key: "wan-2.5", label: "Wan 2.5", kind: "video" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  baidu: [
    { key: "ernie-x1.1", label: "ERNIE X1.1", kind: "multimodal" },
    { key: "ernie-4.5", label: "ERNIE 4.5", kind: "multimodal" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  deepseek: [
    { key: "deepseek-v3.1", label: "DeepSeek-V3.1", kind: "text" },
    {
      key: "deepseek-v3.1-terminus",
      label: "DeepSeek-V3.1-Terminus",
      kind: "text",
    },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  zhipu: [
    { key: "glm-4.5", label: "GLM-4.5", kind: "multimodal" },
    { key: "glm-4.5-air", label: "GLM-4.5-Air", kind: "multimodal" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  "01-ai": [
    { key: "yi-large", label: "Yi-Large", kind: "multimodal" },
    { key: "yi-1.5", label: "Yi-1.5", kind: "multimodal" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  perplexity: [
    { key: "sonar", label: "Sonar", kind: "text" },
    { key: "sonar-pro", label: "Sonar Pro", kind: "text" },
    { key: "sonar-reasoning", label: "Sonar Reasoning", kind: "text" },
    { key: "veo-3", label: "Veo 3 (via Perplexity)", kind: "video" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  xai: [
    { key: "grok-4", label: "Grok 4", kind: "multimodal" },
    { key: "grok-4-fast", label: "Grok 4 Fast", kind: "multimodal" },
    { key: "grok-code-fast-1", label: "Grok Code Fast 1", kind: "text" },
    { key: "grok-3", label: "Grok 3", kind: "multimodal" },
    { key: "grok-2-vision", label: "Grok 2 Vision", kind: "multimodal" },
    { key: "aurora", label: "Aurora", kind: "image" },
    { key: "grok-imagine", label: "Grok Imagine", kind: "video" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  stability: [
    { key: "sdxl", label: "Stable Diffusion XL (SDXL)", kind: "image" },
    { key: "sdxl-turbo", label: "SDXL Turbo", kind: "image" },
    { key: "sd3-medium", label: "Stable Diffusion 3 Medium", kind: "image" },
    { key: "sd3-large", label: "Stable Diffusion 3 Large", kind: "image" },
    { key: "stable-video-4d-2", label: "Stable Video 4D 2.0", kind: "video" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  midjourney: [
    { key: "v7", label: "Midjourney v7", kind: "image" },
    { key: "v7-turbo", label: "Midjourney v7 Turbo", kind: "image" },
    { key: "v7-draft", label: "Midjourney v7 Draft", kind: "image" },
    { key: "niji-7", label: "Niji 7 (anime style)", kind: "image" },
    { key: "video-v1", label: "Video V1", kind: "video" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  ideogram: [
    { key: "ideogram-3-0", label: "Ideogram 3.0", kind: "image" },
    { key: "ideogram-2a", label: "Ideogram 2a", kind: "image" },
    { key: "ideogram-2-0", label: "Ideogram 2.0", kind: "image" },
    { key: "ideogram-1", label: "Ideogram 1.0", kind: "image" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  playground: [
    { key: "playground-v3", label: "Playground v3", kind: "image" },
    { key: "playground-v3-fast", label: "Playground v3 Fast", kind: "image" },
    { key: "playground-v2-5", label: "Playground v2.5", kind: "image" },
    { key: "other", label: "Other (custom)", kind: "custom" },
  ],
  others: [],
};

export const CATEGORY_OPTIONS = [
  "Text Generation",
  "Coding & Dev",
  "Research & Analysis",
  "Education & Tutoring",
  "Marketing & SEO",
  "Product & UX",
  "Data & SQL",
  "System / Instruction",
  "Agents & Tools",
  "Evaluation / Benchmarks",
  "Image Generation",
  "Audio & Voice",
  "Video & Motion",
  "Roleplay & Persona",
  "Brainstorming",
  "Automation / Scripting",
  "Others",
] as const;

export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

export const SUB_CATEGORIES: Record<CategoryOption, string[]> = {
  "Text Generation": [
    "General Chat",
    "Summarization",
    "Translation",
    "Rewrite / Paraphrase",
    "Persona",
    "Socratic",
    "Critique / Review",
    "Explain",
  ],
  "Coding & Dev": [
    "Bug Fix",
    "Refactor",
    "Code Review",
    "Unit Tests",
    "Generate Snippets",
    "Docstrings",
    "Regex",
    "Optimization",
  ],
  "Research & Analysis": [
    "Literature Review",
    "Compare / Contrast",
    "SWOT",
    "Pros & Cons",
    "Data Extraction",
    "Fact‑check",
  ],
  "Education & Tutoring": [
    "Lesson Plan",
    "Quiz",
    "Flashcards",
    "Step-by-step",
    "ELI5",
    "Tutor Persona",
  ],
  "Marketing & SEO": [
    "Ad Copy",
    "Product Description",
    "Email",
    "Landing Page Copy",
    "SEO Keywords",
    "Meta Descriptions",
  ],
  "Product & UX": [
    "User Stories",
    "Acceptance Criteria",
    "UX Heuristics",
    "Onboarding",
    "Microcopy",
    "Wireframe Prompts",
  ],
  "Data & SQL": [
    "SQL Query",
    "Pandas / Dataframes",
    "Data Cleaning",
    "Visualization",
    "Prompting over Tables",
    "Schema Design",
  ],
  "System / Instruction": [
    "System Prompt",
    "Safety / Guardrails",
    "Style Guide",
    "Function / Tool Spec",
    "Memory / Persona",
    "JSON Schema",
  ],
  "Agents & Tools": [
    "ReAct",
    "RAG",
    "Planner",
    "Tool Use",
    "Retriever",
    "Multi-step Agent",
  ],
  "Evaluation / Benchmarks": [
    "Rubric",
    "Test Cases",
    "Adversarial",
    "Self-critique",
    "Judge Prompt",
  ],
  "Image Generation": [
    "Photography",
    "Concept Art",
    "Product Shot",
    "Logo",
    "UI Mockup",
    "Illustration",
    "Anime",
    "Sticker",
    "3D / Render",
  ],
  "Audio & Voice": [
    "TTS Style",
    "Lyrics",
    "Podcast Outline",
    "Voice Clone Prompt",
  ],
  "Video & Motion": [
    "Storyboard",
    "Shot List",
    "Scene Description",
    "VFX Prompt",
  ],
  "Roleplay & Persona": ["Character", "Interview", "Simulation", "Game Master"],
  Brainstorming: ["Ideas", "Names", "Outlines", "Mind Map"],
  "Automation / Scripting": [
    "Shell",
    "Python Script",
    "Zapier / Workflow",
    "API Prompt",
  ],
  Others: [],
};
