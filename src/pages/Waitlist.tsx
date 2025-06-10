import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Determine API URL based on the current environment
const getApiUrl = () => {
  // In development, use localhost
  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }
  
  // In production, use the same origin as the frontend
  // This ensures the API is called on the same domain
  return "https://job-app-assistant.vercel.app";
};

const API_URL = getApiUrl();

// Log the API URL in development to help with debugging
if (import.meta.env.DEV) {
  console.log("Using API URL:", API_URL);
}

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validation
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    console.log("Sending email:", email);

    try {
      const response = await fetch(`${API_URL}/api/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to join waitlist");
      }

      if (data.success) {
        toast.success("Welcome to the waitlist!");
        navigate("/success");
      } else {
        throw new Error(data.error || "Failed to join waitlist");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error instanceof Error) {
        if (error.message.includes("rate limit")) {
          toast.error("Too many attempts. Please try again later.");
        } else if (error.message.includes("already registered")) {
          toast.error("This email is already on our waitlist");
        } else {
          toast.error(error.message || "Failed to join waitlist. Please try again.");
        }
      } else {
        toast.error("Failed to join waitlist. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-muted-background to-background py-16 w-full">
      {/* Hero Section */}
      <div className="py-8 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8">
            Meet your dream job today
          </h1>
          <p className="text-xl text-muted mb-12 max-w-2xl mx-auto">
            Our AI-powered assistant helps you craft the perfect job application tailored to each position. Join the waitlist to get early access.
          </p>
        </div>

      {/* Features Section */}
      <div className="py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Smart Applications</h3>
            <p className="text-muted">
              Our AI-powered assistant helps you craft the perfect job application tailored to each position.
            </p>
          </Card>
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Time Saving</h3>
            <p className="text-muted">
              Automate repetitive tasks and focus on what matters most - landing your dream job.
            </p>
          </Card>
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Early Access</h3>
            <p className="text-muted">
              Get exclusive access to new features and provide feedback to shape the future of our platform.
            </p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-8">
        <Card className="max-w-2xl mx-auto p-12 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Get Early Access
            </h2>
            <p className="text-muted text-lg">
              Join our waitlist to be notified when we launch and receive exclusive early access.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 text-base"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-12 px-8 text-base bg-primary hover:bg-primary-hover"
              >
                {isLoading ? "Joining..." : "Join Waitlist"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
} 