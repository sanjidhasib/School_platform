const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');
const TextbookChunk = require('../models/TextbookChunk');
const AiMessage = require('../models/AiMessage');

const askAi = async (sessionId, classNumber, subjectId, question, language = 'EN') => {
  // Simple RAG without vector embeddings for demo: keyword search
  const keywords = question.split(' ').filter(w => w.length > 3).map(w => new RegExp(w, 'i'));
  
  const chunks = await TextbookChunk.find({
    classNumber,
    subjectId,
    content: { $in: keywords }
  }).limit(3);

  const context = chunks.map(c => c.content).join('\n\n');

  const systemPrompt = `You are a helpful tutor for Class ${classNumber} students in Bangladesh. 
Answer based on the following approved NCTB textbook content.
Language preference: ${language}.
If the textbook content does not contain sufficient information, state that clearly instead of fabricating citations.

CONTEXT:
${context}`;

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'dummy_key');
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let answerText;
  try {
    const result = await model.generateContent([systemPrompt, question]);
    const response = await result.response;
    answerText = response.text();
  } catch (err) {
    answerText = 'Sorry, AI service is currently unavailable.';
  }

  const assistantMessage = await AiMessage.create({
    sessionId,
    role: 'assistant',
    content: answerText,
    sourceChunkIds: chunks.map(c => c._id)
  });

  return { answer: answerText, sources: chunks };
};

module.exports = { askAi };
