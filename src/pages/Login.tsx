import { useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useNavigate, Link } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      navigate("/dashboard")
    }
  }

  return (
    <div className="w-full max-w-md bg-background p-8 rounded-lg shadow-lg space-y-6">
      <h1 className="text-2xl font-bold mb-6 text-center text-foreground">Login</h1>
      {error && <p className="text-destructive mb-4 text-center">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary-hover">
          Login
        </Button>
        <p className="text-sm text-center mt-4 text-muted">
          No account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  )
}