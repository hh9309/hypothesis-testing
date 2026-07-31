export interface LLMConfig {
  apiKey: string;
  model: 'gemini-3.6-flash' | 'deepseek-v4-pro';
}

export const getStoredLLMConfig = (): LLMConfig => {
  const apiKey = typeof window !== 'undefined' ? (localStorage.getItem('user_llm_api_key') || '') : '';
  const storedModel = typeof window !== 'undefined' ? localStorage.getItem('user_llm_model') : null;
  const model = storedModel === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : 'gemini-3.6-flash';
  return { apiKey, model };
};

export const saveLLMConfig = (apiKey: string, model: 'gemini-3.6-flash' | 'deepseek-v4-pro') => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_llm_api_key', apiKey.trim());
    localStorage.setItem('user_llm_model', model);
  }
};

export const callLLMAPI = async (
  prompt: string,
  configOverride?: Partial<LLMConfig>
): Promise<string> => {
  const stored = getStoredLLMConfig();
  const apiKey = (configOverride?.apiKey !== undefined ? configOverride.apiKey : stored.apiKey).trim();
  const model = configOverride?.model || stored.model;

  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  // 1. Try server proxy if running on a Node environment
  try {
    const res = await fetch('/api/ai-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        apiKey,
        model,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text && !data.isFallback) return data.text;
    }
  } catch (e) {
    // Static hosting environment (e.g. GitHub Pages / Netlify), fallback to browser direct REST API
  }

  // 2. Direct Browser REST API execution
  if (model === 'gemini-3.6-flash') {
    // Direct Gemini API call
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Gemini API 调用失败 (HTTP ${response.status})。请检查输入的 API-Key 是否正确。`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini API 未返回有效的分析文本。");
    return text;
  } else {
    // Direct DeepSeek API call (deepseek-v4-pro)
    const url = `https://api.deepseek.com/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位精通假设检验与推断统计的资深统计学家和学术顾问。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `DeepSeek API 调用失败 (HTTP ${response.status})。请检查 API-Key 是否正确。`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("DeepSeek API 未返回有效的分析文本。");
    return text;
  }
};
