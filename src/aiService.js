import { getApiBase } from './api';

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

const API_BASE = getApiBase();

const getAuthHeaders = () => {
  const token = localStorage.getItem('bf_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const extractGeminiText = (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
const isMissingServerKey = (err) => /Missing GEMINI_API_KEY/i.test(err?.message || '');
const isNetworkError = (err) => /Failed to fetch|NetworkError|fetch failed|Load failed|Network request failed/i.test(err?.message || '');
const isGeminiError = (err) => /Gemini API request failed|API key|permission|quota|invalid/i.test(err?.message || '');
const toNetworkError = (err) => {
  const error = new Error('Backend unreachable. Make sure the API server is running.');
  error.cause = err;
  error.code = 'NETWORK_ERROR';
  return error;
};

const localGenerateContent = ({ type, brand, industry, tone, topic, audience }) => {
  const safeBrand = brand || 'your brand';
  const safeIndustry = industry || 'your industry';
  const safeTone = tone || 'professional';
  const safeTopic = topic || 'your latest update';
  const safeAudience = audience || 'your audience';

  switch (type) {
    case 'instagram':
      return `✨ ${safeBrand} is here to help with ${safeTopic}.

We’re building ${safeIndustry} solutions with a ${safeTone} touch for ${safeAudience}.
From planning to launch, we focus on clarity, speed, and impact.
Ready to get started? Let’s talk.

#startup #buildinpublic #${safeIndustry.replace(/\s+/g, '').toLowerCase()} #productlaunch #growth`;
    case 'linkedin':
      return `Launching in ${safeIndustry} isn’t just about features — it’s about outcomes.

At ${safeBrand}, we’re focused on ${safeTopic} with a ${safeTone} approach that puts ${safeAudience} first.

Key takeaways:
- Align with the real business problem
- Build for speed and clarity
- Measure outcomes, not just outputs

If you’re working on similar initiatives, let’s connect.

#${safeIndustry.replace(/\s+/g, '')} #product #leadership`;
    case 'twitter':
      return `1/ ${safeBrand} is sharing lessons on ${safeTopic} 🚀
2/ In ${safeIndustry}, speed + clarity win.
3/ Our ${safeTone} playbook: focus, feedback, iteration.
4/ The result: better outcomes for ${safeAudience}.
5/ Want the details? Let’s chat. #${safeIndustry.replace(/\s+/g, '').toLowerCase()}`;
    case 'hashtags':
      return `**Brand & Niche (5):** #${safeBrand.replace(/\s+/g, '')} #${safeIndustry.replace(/\s+/g, '')} #buildbetter #startuplife #productteam
**Topic Specific (8):** #${safeTopic.split(' ')[0]} #productlaunch #appdevelopment #webdesign #uxdesign #growthmarketing #saas #innovation
**Discovery & Trending (7):** #tech #startup #founders #productivity #digital #marketing #business`;
    case 'carousel':
      return `---SLIDE 1---
TITLE: ${safeTopic}
BODY: The simple way ${safeBrand} helps ${safeAudience}
VISUAL TIP: Bold title with clean icons

---SLIDE 2---
TITLE: The challenge
BODY: In ${safeIndustry}, speed and clarity are everything.
VISUAL TIP: Timeline or roadmap

---SLIDE 3---
TITLE: Our approach
BODY: A ${safeTone} workflow focused on outcomes.
VISUAL TIP: Process steps

---SLIDE 4---
TITLE: What you get
BODY: Strategy, build, launch — all in one place.
VISUAL TIP: Checklist

---SLIDE 5---
TITLE: Real impact
BODY: Faster delivery and stronger results.
VISUAL TIP: Upward chart

---SLIDE 6---
TITLE: For ${safeAudience}
BODY: Built to scale with your goals.
VISUAL TIP: Audience silhouettes

---SLIDE 7---
TITLE: Let’s build
BODY: Ready to start? Reach out today.
VISUAL TIP: CTA button`;
    case 'campaign':
      return `**Campaign Name:** ${safeBrand} Momentum
**Tagline:** Build faster, launch smarter
**Goal:** Drive awareness and leads
**Duration:** 7 days

**Content Calendar (7 days):**
Day 1: Instagram - Launch teaser
Day 2: LinkedIn - Founder story
Day 3: Twitter/X - Key insights
Day 4: Instagram - Customer value
Day 5: LinkedIn - Case study
Day 6: Twitter/X - AMA thread
Day 7: Instagram - CTA + offer

**Key Messages (3):**
1. ${safeBrand} simplifies ${safeTopic}
2. ${safeTone} delivery for ${safeAudience}
3. Results that scale

**Success Metrics:**
- Reach
- Engagement
- Leads`;
    case 'marketing':
      return `**Tagline (5-8 words):**
${safeBrand} builds what you need

**Ad Headline (Facebook/Google):**
Launch your next ${safeTopic}

**Ad Description (30 words):**
${safeBrand} helps ${safeAudience} in ${safeIndustry} plan, build, and launch with confidence. Get a ${safeTone} team that delivers fast.

**Email Subject Line:**
Ready to ship your next product?

**SMS/WhatsApp Message (160 chars):**
${safeBrand} can help you launch ${safeTopic} quickly. Want a quick call?

**Bio/Profile Description (150 chars):**
${safeBrand} builds ${safeIndustry} products for ${safeAudience}. Strategy, design, and development — end to end.`;
    case 'reel':
      return `**TITLE:** ${safeTopic} in 30 seconds
**HOOK (0-3 sec):** “Want to launch faster?”
**SCRIPT:**
[0:00-0:05] Show the challenge in ${safeIndustry}
[0:05-0:15] Introduce ${safeBrand} and the ${safeTone} approach
[0:15-0:25] Show outcomes for ${safeAudience}
[0:25-0:35] Quick proof points and visuals
[0:35-0:45] CTA: “Let’s build together”

**CAPTIONS:** 3 ways to launch smarter with ${safeBrand}
**HASHTAGS:** #${safeIndustry.replace(/\s+/g, '').toLowerCase()} #startup #product
**TRENDING AUDIO SUGGESTION:** Motivational upbeat`;
    default:
      return `${safeBrand} update: ${safeTopic}`;
  }
};

const localGenerateImagePrompt = ({ brand, industry, topic, style }) => (
  `Create a ${style} social media image for ${brand} in the ${industry} space about “${topic}”. ` +
  'Use clean composition, bold typography, and a confident color palette. ' +
  'Include subtle tech motifs, soft gradients, and space for a short headline.'
);

async function requestBackendStream(prompt) {
  let response;
  try {
    response = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ prompt, stream: true }),
    });
  } catch (err) {
    throw toNetworkError(err);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'AI request failed');
  }

  return response;
}

async function requestBackendText(prompt) {
  let response;
  try {
    response = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ prompt, stream: false }),
    });
  } catch (err) {
    throw toNetworkError(err);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'AI request failed');
  }

  return extractGeminiText(data);
}

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
  if (API_BASE) {
    let response;
    try {
      response = await requestBackendStream(prompt);
    } catch (err) {
      if ((isMissingServerKey(err) || err.code === 'NETWORK_ERROR' || isNetworkError(err)) && apiKey) {
        try {
          const { text } = await requestGeminiText(prompt, apiKey);
          onChunk?.(text, text);
          return text;
        } catch (geminiErr) {
          if (isGeminiError(geminiErr)) {
            const text = localGenerateContent({ type, brand, industry, tone, topic, audience });
            onChunk?.(text, text);
            return text;
          }
          throw geminiErr;
        }
      }
      try {
        const text = await requestBackendText(prompt);
        onChunk?.(text, text);
        return text;
      } catch (fallbackErr) {
        if ((isMissingServerKey(fallbackErr) || fallbackErr.code === 'NETWORK_ERROR' || isNetworkError(fallbackErr)) && apiKey) {
          try {
            const { text } = await requestGeminiText(prompt, apiKey);
            onChunk?.(text, text);
            return text;
          } catch (geminiErr) {
            if (isGeminiError(geminiErr)) {
              const text = localGenerateContent({ type, brand, industry, tone, topic, audience });
              onChunk?.(text, text);
              return text;
            }
            throw geminiErr;
          }
        }
        throw fallbackErr;
      }
    }

    if (!response.body) {
      const text = await requestBackendText(prompt);
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
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data) continue;

        try {
          const parsed = JSON.parse(data);
          const chunk = extractGeminiText(parsed);
          if (chunk) {
            fullText += chunk;
            onChunk?.(fullText, chunk);
          }
        } catch { /* skip malformed lines */ }
      }
    }

    return fullText;
  }

  if (!apiKey) {
    const text = localGenerateContent({ type, brand, industry, tone, topic, audience });
    onChunk?.(text, text);
    return text;
  }

  let response;
  try {
    ({ response } = await requestGeminiStream(prompt, apiKey));
  } catch {
    try {
      const { text } = await requestGeminiText(prompt, apiKey);
      onChunk?.(text, text);
      return text;
    } catch (geminiErr) {
      if (isGeminiError(geminiErr)) {
        const text = localGenerateContent({ type, brand, industry, tone, topic, audience });
        onChunk?.(text, text);
        return text;
      }
      throw geminiErr;
    }
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
  const prompt = `Create a detailed image generation prompt for a social media post.
Brand: ${brand} (${industry})
Topic: ${topic}
Style: ${style}

Write a single, detailed prompt (100-150 words) for generating a professional social media image.
Include: composition, colors, mood, style elements, and brand feel.
Return ONLY the image prompt, no explanations.`;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (API_BASE) {
    try {
      return await requestBackendText(prompt);
    } catch (err) {
      if ((!isMissingServerKey(err) && !isNetworkError(err) && err.code !== 'NETWORK_ERROR') || !apiKey) {
        throw err;
      }
    }
  }

  if (!apiKey) {
    return localGenerateImagePrompt({ brand, industry, topic, style });
  }

  try {
    const { text } = await requestGeminiText(prompt, apiKey);
    return text;
  } catch (err) {
    if (isGeminiError(err)) {
      return localGenerateImagePrompt({ brand, industry, topic, style });
    }
    throw err;
  }
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
