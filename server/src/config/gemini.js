import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || 'dummy_gemini_key';
const genAI = new GoogleGenerativeAI(apiKey);

export default genAI;
