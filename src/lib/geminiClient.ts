// Gemini API client for tailored resume suggestions

export interface GeminiJobDetails {
  company: string;
  jobTitle: string;
  jobDescription: string;
  customQuestions: string[];
  generateCoverLetter: boolean;
}

export interface GeminiResume {
  fullName: string;
  jobTitle: string;
  location: string;
  email: string;
  portfolio: string;
  linkedin: string;
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    period: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    period: string;
    description: string;
  }>;
  skills: string;
  tools: string;
  languages: string;
}

export interface GeminiAISuggestions {
  summary: string;
  workExperience: Array<{
    company: string;
    title: string;
    date: string;
    bullets: string[];
  }>;
  skills: string;
  tools: string;
  education: string;
  coverLetter?: string;
  customQuestionAnswers: string[];
}

export async function generateTailoredResumeWithGemini({
  resume,
  jobDetails,
  apiKey,
  endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
}: {
  resume: GeminiResume,
  jobDetails: GeminiJobDetails,
  apiKey: string,
  endpoint?: string,
}): Promise<GeminiAISuggestions> {
  const prompt = `You are an expert resume and cover letter writer. Given the following resume and job details, generate:
- Tailored summary, work experience, skills, tools, education sections
- A cover letter (if requested)
- Answers to the custom questions

Resume:
${JSON.stringify(resume, null, 2)}

Job Details:
${JSON.stringify(jobDetails, null, 2)}

Return ONLY a valid JSON object, with no explanation, markdown, or code block formatting. Do not include triple backticks or any text before or after the JSON.
{
  summary: string,
  workExperience: Array<{ company: string, title: string, date: string, bullets: string[] }>,
  skills: string,
  tools: string,
  education: string,
  coverLetter?: string,
  customQuestionAnswers: string[]
}
`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  const url = endpoint;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // Gemini returns the text in data.candidates[0].content.parts[0].text
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('Gemini raw response:', text);
  if (!text) throw new Error('No response from Gemini');

  // Try to parse the JSON from the model's response, stripping code block formatting if present
  let jsonText = text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```/, '').replace(/```$/, '').trim();
  }
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    throw new Error('Failed to parse Gemini response as JSON. Raw response: ' + jsonText);
  }
} 