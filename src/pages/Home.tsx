import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const [email, setEmail] = useState("")
  const [jobs, setJobs] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const getUser = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        navigate("/")
      } else {
        setEmail(user.email || "")

        const { data: jobData } = await supabase
          .from("jobs")
          .select("id, company_name, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (jobData) setJobs(jobData)
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  return (
    <div className="w-full max-w-4xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome, {email}</h1>
        <Button onClick={handleLogout} variant="destructive">
          Log Out
        </Button>
      </div>
      
      <div className="flex gap-4">
        <Button asChild variant="default">
          <Link to="/user-info">Go to User Info</Link>
        </Button>
        <Button asChild variant="default">
          <Link to="/add-job">Add Job</Link>
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Your Jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-gray-500">No jobs yet.</p>
        ) : (
          <ul className="space-y-3">
            {jobs.map(job => (
              <li key={job.id} className="flex items-center gap-2">
                <Link to={`/job/${job.id}`} className="text-blue-600 hover:underline">
                  {job.company_name}
                </Link>
                <span className="text-sm text-gray-500">
                  ({new Date(job.created_at).toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}