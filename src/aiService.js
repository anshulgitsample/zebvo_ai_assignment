// ── Prompt Templates ─────────────────────────────────────
const PROMPTS = {
  instagram: ({ brand, industry, tone, topic, audience }) =>
    `You are a world-class social media strategist for ${brand}, a ${industry} brand.
Write an engaging Instagram caption about: "${topic}"
Target audience: ${audience || 'general audience'}
Tone: ${tone}

Requirements:
- Hook in first line (stops the scroll)
- 3-5 sentences of compelling body copy
- Clear call to action
- 5-8 relevant hashtags at the end
- Use line breaks for readability
- Include 2-3 relevant emojis naturally placed

Return ONLY the caption with hashtags. No explanations.`,

  linkedin: ({ brand, industry, tone, topic, audience }) =>
    `You are a LinkedIn thought leader writing for ${brand} in the ${industry} space.
Write a LinkedIn post about: "${topic}"
Target audience: ${audience || 'professionals'}
Tone: ${tone}

Requirements:
- Strong opening line (first 2 lines visible before "see more")
- Valuable insights or story (150-200 words)
- 3 key takeaways as bullet points
- Professional call to action
- 3-5 relevant hashtags

Return ONLY the post content. No explanations.`,

  twitter: ({ brand, industry, tone, topic, audience }) =>
    `You are writing a Twitter/X thread for ${brand} in ${industry}.
Topic: "${topic}"
Tone: ${tone}
Audience: ${audience || 'general'}

Write a 5-tweet thread. Format exactly as:
1/ [First tweet - the hook, max 280 chars]
2/ [Second tweet - context/setup]
3/ [Third tweet - main insight]
4/ [Fourth tweet - example or proof]
5/ [Fifth tweet - conclusion + CTA]

Each tweet max 280 characters. Use 1-2 relevant hashtags only in last tweet.
Return ONLY the numbered thread.`,

  hashtags: ({ brand, industry, topic }) =>
    `Generate 20 highly targeted hashtags for a ${industry} brand called ${brand} posting about: "${topic}"

Return 20 hashtags in this exact format, grouped:
**Brand & Niche (5):** #tag1 #tag2 ...
**Topic Specific (8):** #tag1 #tag2 ...
**Discovery & Trending (7):** #tag1 #tag2 ...

Mix of popular (1M+), medium (100K-1M), and niche (<100K) hashtags.
Return ONLY the hashtags in the specified format.`,

  carousel: ({ brand, industry, tone, topic, audience }) =>
    `Create a 7-slide Instagram/LinkedIn carousel for ${brand} (${industry}) about: "${topic}"
Tone: ${tone}, Audience: ${audience || 'general'}

Format each slide EXACTLY like this:
---SLIDE 1---
TITLE: [Bold headline]
BODY: [2-3 lines of content]
VISUAL TIP: [Brief description of what to show visually]

Do this for all 7 slides. Slide 1 = hook, Slides 2-6 = content, Slide 7 = CTA.
Return ONLY the slides in this format.`,

  campaign: ({ brand, industry, tone, topic, audience }) =>
    `Create a complete social media campaign for ${brand} (${industry}).
Campaign theme: "${topic}"
Tone: ${tone}, Target: ${audience || 'general'}

Include:
**Campaign Name:** [Creative name]
**Tagline:** [Memorable tagline]
**Goal:** [Primary objective]
**Duration:** [Recommended timeline]

**Content Calendar (7 days):**
Day 1: [Platform] - [Content idea]
Day 2: [Platform] - [Content idea]
...Day 7

**Key Messages (3):**
1. [Message 1]
2. [Message 2]
3. [Message 3]

**Success Metrics:**
- [KPI 1]
- [KPI 2]
- [KPI 3]

Return ONLY the campaign plan.`,

  marketing: ({ brand, industry, tone, topic, audience }) =>
    `Write short marketing copy for ${brand} (${industry}) about: "${topic}"
Tone: ${tone}, Audience: ${audience || 'general'}

Create ALL of the following:

**Tagline (5-8 words):**
[tagline]

**Ad Headline (Facebook/Google):**
[headline]

**Ad Description (30 words):**
[description]

**Email Subject Line:**
[subject]

**SMS/WhatsApp Message (160 chars):**
[message]

**Bio/Profile Description (150 chars):**
[bio]

Return ONLY the labeled marketing copy above.`,

  reel: ({ brand, industry, tone, topic, audience }) =>
    `Write a viral short-form video/reel script for ${brand} (${industry}).
Topic: "${topic}", Tone: ${tone}, Audience: ${audience || 'general'}

Format:
**TITLE:** [Video title]
**HOOK (0-3 sec):** [What you say/show immediately]
**SCRIPT:**
[0:00-0:05] [Action + Dialogue]
[0:05-0:15] [Action + Dialogue]
[0:15-0:25] [Action + Dialogue]
[0:25-0:35] [Action + Dialogue]
[0:35-0:45] [CTA + Closing]

**CAPTIONS:** [3 caption options]
**HASHTAGS:** [10 relevant hashtags]
**TRENDING AUDIO SUGGESTION:** [Type of music/sound]

Return ONLY the script in this format.`,
};

const PREFERRED_GEMINI_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-1.0-pro',
  'gemini-1.0-pro-latest',
];

const GEMINI_BASE_URLS = [
  'https://generativelanguage.googleapis.com/v1',
  'https://generativelanguage.googleapis.com/v1beta',
];

let modelCache = null;

async function getAvailableModels(apiKey) {
  if (modelCache) return modelCache;

  const models = [];
  for (const baseUrl of GEMINI_BASE_URLS) {
    const response = await fetch(`${baseUrl}/models?key=${apiKey}`);
    if (!response.ok) continue;

    const data = await response.json().catch(() => ({}));
    const items = Array.isArray(data.models) ? data.models : [];
    for (const item of items) {
      const name = item.name?.split('/').pop();
      if (!name) continue;
      models.push({
        name,
        baseUrl,
        methods: item.supportedGenerationMethods || [],
      });
    }
  }

  const byName = new Map(models.map(model => [model.name, model]));
  const ordered = PREFERRED_GEMINI_MODELS
    .map(name => byName.get(name))
    .filter(Boolean);

  modelCache = ordered.length ? ordered : models;
  return modelCache;
}

async function requestGeminiStream(prompt, apiKey) {
  let lastError;
  const candidates = await getAvailableModels(apiKey);
  for (const candidate of candidates) {
    if (!candidate.methods.includes('streamGenerateContent')) continue;
    const response = await fetch(
      `${candidate.baseUrl}/models/${candidate.name}:streamGenerateContent?key=${apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (response.ok) return { response, model: candidate.name };

    const err = await response.json().catch(() => ({}));
    lastError = err.error?.message || `Gemini API request failed for model ${candidate.name}`;
  }

  throw new Error(lastError || 'Gemini API request failed');
}

async function requestGeminiText(prompt, apiKey) {
  let lastError;
  const candidates = await getAvailableModels(apiKey);
  for (const candidate of candidates) {
    if (!candidate.methods.includes('generateContent')) continue;
    const response = await fetch(
      `${candidate.baseUrl}/models/${candidate.name}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return {
        text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        model: candidate.name,
      };
    }

    lastError = data.error?.message || `Gemini API request failed for model ${candidate.name}`;
  }

  throw new Error(lastError || 'Gemini API request failed');
}

// ── Main generation function ──────────────────────────────
export async function generateContent({ type, brand, industry, tone, topic, audience, onChunk }) {
  const promptFn = PROMPTS[type];
  if (!promptFn) throw new Error(`Unknown content type: ${type}`);

  const prompt = promptFn({ brand, industry, tone, topic, audience });
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Please add VITE_GEMINI_API_KEY to your .env file');
  }

  let response;
  try {
    ({ response } = await requestGeminiStream(prompt, apiKey));
  } catch {
    const { text } = await requestGeminiText(prompt, apiKey);
    onChunk?.(text, text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep last incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data) continue;
      
      try {
        const parsed = JSON.parse(data);
        const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunk) {
          fullText += chunk;
          onChunk?.(fullText, chunk);
        }
      } catch { /* skip malformed lines */ }
    }
  }

  return fullText;
}

// ── Image description generator (simulated) ──────────────
export async function generateImagePrompt({ brand, industry, topic, style = 'modern' }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Please add VITE_GEMINI_API_KEY to your .env file');
  }

  const prompt = `Create a detailed image generation prompt for a social media post.
Brand: ${brand} (${industry})
Topic: ${topic}
Style: ${style}

Write a single, detailed prompt (100-150 words) for generating a professional social media image.
Include: composition, colors, mood, style elements, and brand feel.
Return ONLY the image prompt, no explanations.`;

  const { text } = await requestGeminiText(prompt, apiKey);
  return text;
}

export const CONTENT_TYPES = [
  { id: 'instagram', label: 'Instagram Caption', icon: '📸', platform: 'Instagram', badge: 'platform-ig' },
  { id: 'linkedin', label: 'LinkedIn Post', icon: '💼', platform: 'LinkedIn', badge: 'platform-li' },
  { id: 'twitter', label: 'Twitter/X Thread', icon: '🐦', platform: 'Twitter/X', badge: 'platform-tw' },
  { id: 'hashtags', label: 'Hashtag Pack', icon: '#️⃣', platform: 'All', badge: 'badge-gray' },
  { id: 'carousel', label: 'Carousel Text', icon: '🎠', platform: 'Multi', badge: 'badge-purple' },
  { id: 'campaign', label: 'Campaign Ideas', icon: '🚀', platform: 'All', badge: 'badge-blue' },
  { id: 'marketing', label: 'Marketing Copy', icon: '📣', platform: 'All', badge: 'badge-green' },
  { id: 'reel', label: 'Reel Script', icon: '🎬', platform: 'Reels', badge: 'badge-warn' },
];

export const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual & Friendly' },
  { id: 'humorous', label: 'Humorous & Witty' },
  { id: 'inspirational', label: 'Inspirational' },
  { id: 'educational', label: 'Educational' },
  { id: 'bold', label: 'Bold & Assertive' },
  { id: 'empathetic', label: 'Empathetic' },
  { id: 'luxury', label: 'Luxury & Exclusive' },
];

export const INDUSTRIES = [
  'Technology', 'E-commerce', 'Healthcare', 'Finance', 'Food & Beverage',
  'Fashion & Beauty', 'Real Estate', 'Education', 'Travel & Hospitality',
  'Fitness & Wellness', 'Entertainment', 'Non-profit', 'Consulting', 'Other',
];
