import { openai } from './openai.js';


export async function classifyEmotion(text) {
  const systemPrompt =
    'You are an emotion classifier. ' +
    'Given a short user sentence, respond ONLY with a JSON object ' +
    'containing the keys "label" and "score" (0-1). ' +
    'Valid labels: joy, sadness, anger, fear, surprise, neutral. ' +
    'Respond in English, no additional text.';

  const { choices } = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: text },
    ],
  });

  try {
    return JSON.parse(choices[0].message.content);
  } catch {
    return { label: 'neutral', score: 0 };
  }
}
