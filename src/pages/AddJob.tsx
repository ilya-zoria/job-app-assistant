import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { toast } from "sonner"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

async function generateAIAnswers(questions: string[], jobDescription: string, geminiKey: string, userProfile: any) {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const answers = [];
  for (const question of questions) {
    const prompt = `
You're helping a candidate apply for a job. Use the user's profile and job description to answer the questions clearly and professionally.

Rules for your response:
1. Keep the length to a maximum of one concise paragraph.
2. Use bullet points for listing skills or achievements
3. Highlight relevant experience that matches the job requirements
4. Be specific and provide concrete examples
5. Use professional but conversational tone
6. Format text using markdown:
   - Use **bold** for emphasis
   - Use * for bullet points
   - Use proper paragraph breaks
7. Focus on quantifiable achievements when possible
8. Avoid generic statements
9. If information is missing from the profile, acknowledge it briefly and focus on available information
10. Address the custom question directly and thoroughly
11. Frame the response as if helping the user stand out among candidates
12. Tailor examples specifically to the job role or industry when possible
13. Write in the first person (use "I", "my", "me") to reflect the candidate's own voice.
14. Make the answer sound as human and natural as possible, avoiding robotic or overly formal phrasing.

User Profile:
- Name: ${userProfile.first_name || ""} ${userProfile.last_name || ""}
- LinkedIn: ${userProfile.linkedin_url || "N/A"}
- Skills: ${Array.isArray(userProfile.skills) ? userProfile.skills.join(", ") : (userProfile.skills || "N/A")}
- Achievements: ${Array.isArray(userProfile.achievements) ? userProfile.achievements.join(", ") : (userProfile.achievements || "N/A")}
- CV: ${userProfile.cv_text || "N/A"}

Job Description:
${jobDescription}

Question: ${question}

Please provide a detailed and professional answer that highlights the candidate's relevant experience and skills for this position.
Answer:`;
    try {
      console.log("Making Gemini API call...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text().trim();
      console.log("Generated answer:", answer);
      answers.push(answer);
    } catch (error) {
      console.error("Error in Gemini API call:", error);
      throw error;
    }
  }
  console.log("All generated answers:", answers);
  return answers;
}

export default function AddJob() {
  const [userId, setUserId] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [questions, setQuestions] = useState([""])
  const [userProfile, setUserProfile] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return navigate("/")
      setUserId(data.user.id)

      // Fetch user profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .single()
      
      if (profileData) {
        setUserProfile(profileData)
      }
    }
    loadUser()
  }, [])

  const handleAddQuestion = () => {
    setQuestions([...questions, ""])
  }

  const handleChangeQuestion = (index: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[index] = value
    setQuestions(newQuestions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const filteredQuestions = questions.filter(q => q.trim() !== "")

    const saveJobPromise = new Promise(async (resolve, reject) => {
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          user_id: userId,
          company_name: companyName,
          job_description: jobDescription,
          custom_questions: filteredQuestions
        })
        .select()
        .single()

      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });

    let savedJobData: any = null;

    await toast.promise(
      saveJobPromise,
      {
        loading: "Saving job...",
        success: (data) => {
          savedJobData = data;
          return "Job saved!";
        },
        error: (err: Error) => {
          console.error("Error saving job:", err);
          return err.message || "Error saving job";
        }
      }
    );

    if (!savedJobData) return;

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('Gemini API Key present:', !!geminiKey);
    if (!geminiKey) {
      toast.error("Gemini API key is missing!");
      navigate(`/job/${savedJobData.id}`);
      return;
    }

    if (!userProfile) {
      toast.error("Please complete your profile first!");
      navigate(`/user-info`);
      return;
    }

    try {
      await toast.promise(
        (async () => {
          console.log("Starting AI answer generation...");
          const aiAnswers = await generateAIAnswers(filteredQuestions, jobDescription, geminiKey, userProfile);
          console.log("Generated AI answers:", aiAnswers);
          
          const { error: updateError } = await supabase
            .from("jobs")
            .update({ ai_answers: aiAnswers })
            .eq("id", savedJobData.id);
            
          if (updateError) {
            console.error("Error updating job with AI answers:", updateError);
            throw updateError;
          }
          console.log("Successfully updated job with AI answers");
        })(),
        {
          loading: "Generating AI answers...",
          success: "AI answers generated!",
          error: "Error generating AI answers"
        }
      )
    } catch (err) {
      console.error("AI answer generation failed:", err)
      toast.error("AI answer generation failed.")
    }
    navigate(`/job/${savedJobData.id}`)
  }

  return (
    <div className="w-full max-w-4xl bg-background py-8 space-y-6">
      <Link to="/dashboard" className="text-primary hover:underline">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-bold text-foreground">Add Job</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
        <textarea
          placeholder="Job Description"
          className="input min-h-[120px]"
          rows={5}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          required
        />
        <div className="space-y-2">
          {questions.map((q, i) => (
            <Input
              key={i}
              type="text"
              placeholder={`Custom Question #${i + 1}`}
              value={q}
              onChange={(e) => handleChangeQuestion(i, e.target.value)}
            />
          ))}
          <Button type="button" onClick={handleAddQuestion} variant="link" className="text-primary px-0">
            + Add another question
          </Button>
        </div>
        <Button type="submit" disabled={false} className="w-full bg-primary hover:bg-primary-hover">
          {false && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
          Save Job
        </Button>
      </form>
    </div>
  )
}