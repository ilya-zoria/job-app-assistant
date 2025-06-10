import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { motion, AnimatePresence } from "framer-motion"

export default function JobDetails() {
  const { id } = useParams()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatingAnswers, setGeneratingAnswers] = useState(false)
  const navigate = useNavigate()

  const fetchJob = async () => {
    if (!id) return
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    console.log("Job ID:", id)
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single()

    if (error) console.error("Error fetching job:", error)
    else {
      console.log("Fetched job data:", data);
      // Parse AI answers if it's a string
      if (typeof data.ai_answers === 'string') {
        try {
          data.ai_answers = JSON.parse(data.ai_answers);
        } catch (e) {
          console.error("Error parsing AI answers:", e);
          data.ai_answers = [];
        }
      }
      console.log("AI answers type:", typeof data.ai_answers);
      console.log("AI answers is array:", Array.isArray(data.ai_answers));
      console.log("AI answers:", data.ai_answers);
      setJob(data)
      
      // If we have questions but no answers, set generating state
      if (data.custom_questions?.length > 0 && (!data.ai_answers || data.ai_answers.length === 0)) {
        setGeneratingAnswers(true)
      } else {
        setGeneratingAnswers(false)
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchJob()
  }, [id])

  // Poll for updates when generating answers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (generatingAnswers) {
      interval = setInterval(() => {
        fetchJob()
      }, 2000) // Check every 2 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [generatingAnswers])

  const handleDelete = async () => {
    if (!id) return
    const result = await toast.promise(
      Promise.resolve(supabase.from("jobs").delete().eq("id", id)),
      {
        loading: "Deleting job...",
        success: "Job deleted!",
        error: "Error deleting job"
      }
    ) as unknown as { error: any }
    
    if (!result.error) {
      navigate("/dashboard")
    }
  }

  if (loading) return <div className="py-8 text-center">Loading...</div>
  if (!job) return <div className="py-8 text-center">Job not found</div>

  return (
    <div className="mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/dashboard" className="text-blue-600 hover:underline">&larr; Back to Dashboard</Link>
        <Dialog>
          <DialogTrigger asChild>
            <button className="bg-red-600 text-white px-4 py-2 rounded ml-4">Delete Job</button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Job</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this job? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <button className="px-4 py-2 rounded border">Cancel</button>
              </DialogClose>
              <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded">Delete Job</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <h1 className="text-2xl font-bold mb-2">{job.company_name}</h1>
      <p className="mb-4 whitespace-pre-wrap">{job.job_description}</p>

      <h2 className="text-lg font-semibold mb-4">Custom Questions:</h2>
      <Accordion type="single" collapsible className="w-full">
        {job.custom_questions?.map((q: string, i: number) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">
              <span className="font-medium">{q}</span>
            </AccordionTrigger>
            <AccordionContent>
              <AnimatePresence>
                {generatingAnswers ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-gray-500 mt-2"
                  >
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>Generating answer...</span>
                  </motion.div>
                ) : job.ai_answers && Array.isArray(job.ai_answers) && job.ai_answers[i] ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-gray-700 mt-2 pl-4 border-l-2 border-blue-200 prose prose-sm max-w-none"
                  >
                    {job.ai_answers[i].split('\n').map((paragraph: string, index: number) => {
                      // Handle markdown-style bold text
                      const formattedParagraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      // Handle bullet points
                      if (paragraph.trim().startsWith('*')) {
                        return (
                          <ul key={index} className="list-disc ml-6 my-2">
                            <li dangerouslySetInnerHTML={{ __html: formattedParagraph.replace(/^\*\s*/, '') }} />
                          </ul>
                        );
                      }
                      return (
                        <p key={index} className="my-2" dangerouslySetInnerHTML={{ __html: formattedParagraph }} />
                      );
                    })}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}