import { SyllabusItem, Exam, AIStudyAdvice } from "../types";

const API_KEY = process.env.REACT_APP_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Helper to clean JSON output from Llama which often adds markdown code blocks
const cleanJsonOutput = (text: string): string => {
  let cleaned = text.trim();
  // Remove markdown code blocks if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "");
  }
  return cleaned.trim();
};

const callOpenRouter = async (messages: any[]) => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set REACT_APP_API_KEY in your .env file.");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000", // Optional: required by OpenRouter for analytics
      "X-Title": "Roncate Education"
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API Error: ${err}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

export const generateStudyStrategy = async (
  syllabus: SyllabusItem[],
  exams: Exam[]
): Promise<AIStudyAdvice> => {
  const incompleteTopics = syllabus.filter(s => !s.completed).map(s => `${s.topic} (${s.difficulty})`);
  const upcomingExams = exams.map(e => `${e.title} on ${e.date}`);

  const prompt = `
    You are an expert academic study coach. Analyze the student's data and provide a strategy.
    
    Student Data:
    Incomplete Topics: ${incompleteTopics.length > 0 ? incompleteTopics.join(', ') : "None recorded"}
    Upcoming Exams: ${upcomingExams.length > 0 ? upcomingExams.join(', ') : "None scheduled"}

    Return ONLY a JSON object with the following structure (no other text):
    {
      "message": "Motivational advice and strategy summary (max 100 words)",
      "priorityTopics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  `;

  try {
    const rawText = await callOpenRouter([
      { role: "system", content: "You are a helpful AI assistant that outputs only valid JSON." },
      { role: "user", content: prompt }
    ]);

    const cleanedJson = cleanJsonOutput(rawText);
    const result = JSON.parse(cleanedJson);

    return {
      message: result.message || "Keep studying consistently!",
      priorityTopics: result.priorityTopics || [],
      generatedAt: Date.now()
    };

  } catch (error) {
    console.error("AI API Error:", error);
    return {
      message: "Unable to generate study plan. Please check your network or API key.",
      generatedAt: Date.now(),
      priorityTopics: []
    };
  }
};

export const parseSyllabusFromText = async (text: string, subjectId: string): Promise<Partial<SyllabusItem>[]> => {
  const prompt = `
    Extract study topics from the following syllabus text.
    
    Text: "${text.substring(0, 4000)}"

    Return ONLY a JSON array of objects (no other text) with this structure:
    [
      { "topic": "Topic Name", "difficulty": "Easy" },
      { "topic": "Another Topic", "difficulty": "Hard" }
    ]
    Difficulty must be one of: Easy, Medium, Hard.
  `;

  try {
    const rawText = await callOpenRouter([
      { role: "system", content: "You are a helpful AI assistant that outputs only valid JSON arrays." },
      { role: "user", content: prompt }
    ]);

    const cleanedJson = cleanJsonOutput(rawText);
    const parsed = JSON.parse(cleanedJson);
    
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        topic: item.topic,
        difficulty: ["Easy", "Medium", "Hard"].includes(item.difficulty) ? item.difficulty : "Medium"
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to parse syllabus", error);
    return [];
  }
};