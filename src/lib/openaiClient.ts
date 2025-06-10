export async function generateAIAnswers({
    jobDescription,
    questions,
    userProfile,
  }: {
    jobDescription: string
    questions: string[]
    userProfile: {
      firstName?: string
      lastName?: string
      linkedin_url?: string
      skills?: string[]
      achievements?: string[]
      cv_text?: string
    }
  }): Promise<string[]> {
    const prompt = `
  You're helping a candidate apply for a job. Use the user's profile and job description to answer the questions clearly and professionally.
  
  User Profile:
  - Name: ${userProfile.firstName || ""} ${userProfile.lastName || ""}
  - LinkedIn: ${userProfile.linkedin_url || "N/A"}
  - Skills: ${userProfile.skills?.join(", ") || "N/A"}
  - Achievements: ${userProfile.achievements?.join(", ") || "N/A"}
  - CV: ${userProfile.cv_text || "N/A"}
  
  Job Description:
  ${jobDescription}
  
  Answer the following questions:
  
  ${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}
  `
  
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4", // or "gpt-3.5-turbo"
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    })
  
    const result = await response.json()
    const text = result.choices?.[0]?.message?.content || ""
  
    // Split output into individual answers (based on numbered list)
    const answers = questions.map((_, i) => {
      const regex = new RegExp(`${i + 1}[).\\s]+(.+?)(?=${i + 2}[).\\s]|$)`, "s")
      const match = text.match(regex)
      return match?.[1]?.trim() || ""
    })
  
    return answers
  }