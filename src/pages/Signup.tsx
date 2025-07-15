import { useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect") || "/";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
    } else {
      navigate(redirect)
    }
  }

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  return (
    <div className="flex flex-col overflow-hidden gap-20">
      <img src="/assets/logo.svg" alt="Resume builder logo" className="h-12 mt-6 mb-8 mx-auto" />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="text-center mb-20">Get ATS-friendly<br/>resume tailored for any job</h1>
        <div className="w-full max-w-sm flex flex-col gap-4">
          <Button onClick={handleGoogleSignup} className="w-full bg-[#181c2a] text-white text-base font-medium py-6 flex items-center justify-center gap-2 mb-2">
            <img src="/assets/ic_google.svg" alt="Google" className="mr-2 w-5 h-5" />
            Continue with Google
          </Button>
          <div className="flex items-center my-2">
            <div className="flex-grow h-px bg-gray-300" />
            <span className="mx-3 text-gray-500 text-sm font-medium">OR</span>
            <div className="flex-grow h-px bg-gray-300" />
          </div>
          <form onSubmit={handleSignup} className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="h-12 text-base"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="h-12 text-base"
            />
            <Button type="submit" variant="outline" className="w-full text-base font-medium h-12 mt-2">Sign up</Button>
            {error && <p className="text-destructive text-center text-sm mt-2">{error}</p>}
          </form>
          <p className="text-center text-gray-400 text-base mt-4">Already have an account? <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"} className="text-gray-500 underline">Log in</Link></p>
        </div>
      </div>
    </div>
  )
}