/**
 * AI Client - Uses OpenAI API (supports vision for image analysis)
 * Falls back to DeepSeek for text-only tasks
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

async function chat(messages, options = {}) {
    // Use OpenAI for vision tasks, DeepSeek for text
    const useVision = options.vision === true;
    const apiKey = useVision
        ? process.env.OPENAI_API_KEY
        : (process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY);

    if (!apiKey) throw new Error('No AI API key configured');

    const url = useVision ? OPENAI_URL : DEEPSEEK_URL;
    const model = useVision
        ? (process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini')
        : (process.env.DEEPSEEK_MODEL || 'deepseek-chat');

    const body = {
        model,
        messages,
        stream: false,
        max_tokens: options.maxTokens || 2000,
        ...(options.json && !useVision ? { response_format: { type: 'json_object' } } : {})
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.text();
        const error = new Error(`AI API error: ${response.status} - ${err}`);
        error.status = response.status;
        throw error;
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

module.exports = { chat };
