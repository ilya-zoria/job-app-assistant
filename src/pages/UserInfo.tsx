import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react" 
import { toast } from "sonner"

export default function UserInfo() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [skills, setSkills] = useState("")
  const [achievements, setAchievements] = useState("")
  const [cvText, setCvText] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        navigate("/")
        return
      }
      setUserId(user.id)

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (data) {
        setFirstName(data.first_name || "")
        setLastName(data.last_name || "")
        setLinkedin(data.linkedin_url || "")
        setSkills(Array.isArray(data.skills) ? data.skills.join(", ") : (data.skills || ""))
        setAchievements(Array.isArray(data.achievements) ? data.achievements.join(", ") : (data.achievements || ""))
        setCvText(data.cv_text || "")
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const updates = {
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      linkedin_url: linkedin,
      skills: skills.split(",").map(s => s.trim()),
      achievements: achievements.split(",").map(a => a.trim()),
      cv_text: cvText,
    }

    const { error } = await toast.promise(
      supabase.from("user_profiles").upsert(updates, { onConflict: 'user_id' }),
      {
        loading: "Saving...",
        success: "Profile saved!",
        error: "Error saving profile",
      }
    )

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/dashboard" className="text-blue-600 hover:underline">&larr; Back to Dashboard</Link>
      </div>
      <h1 className="text-2xl font-bold">Your Info</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <Input
          type="url"
          placeholder="LinkedIn URL"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
        />
        <textarea
          placeholder="CV Text (optional)"
          rows={5}
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Skills (comma separated)"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Achievements (comma separated)"
          value={achievements}
          onChange={(e) => setAchievements(e.target.value)}
        />
        <Button type="submit" disabled={saving} className="w-full">
          {saving && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
          {saving ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  )
}