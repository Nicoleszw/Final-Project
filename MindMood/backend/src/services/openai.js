// openai.js
import OpenAI from 'openai';
import { config } from 'dotenv';
import https from 'https';

config();

const agent = new https.Agent({ keepAlive: true });

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  httpAgent: agent,
  maxRetries: 2,
});
