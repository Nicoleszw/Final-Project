import OpenAI from 'openai';
import { config } from 'dotenv';
config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
