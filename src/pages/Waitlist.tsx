import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import VariableProximity from '@/components/VariableProximity';

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
  const containerRef = useRef(null);

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
    <div className="flex flex-col md:flex-row min-h-screen h-screen">
      {/* Left Column */}
      <div className="w-full max-w-[476px] flex flex-col justify-start md:justify-center px-10 md:px-12 py-6 md:py-10 h-screen md:h-full min-h-screen mx-auto overflow-y-auto">
        <div>
          {/* Logo */}
          <div className="flex items-center mb-12">
            <img src="/logo.svg" alt="Resume builder logo" className="h-32 w-32 mr-2" />
          </div>
          {/* Heading */}
          {/* <h1 className="text-5xl md:text-7xl font-instrument-serif italic font-medium mb-6 leading-tight text-gray-900">Meet your dream job faster</h1> */}
          <div
            ref={containerRef}
            style={{position: 'relative'}}
            >
            <VariableProximity
              label={'Meet your dream job faster'}
              className="text-5xl md:text-7xl italic leading-tight text-gray-900"
              fromFontVariationSettings="'wght' 300, 'opsz' 9"
              toFontVariationSettings="'wght' 900, 'opsz' 40"
              containerRef={containerRef}
              radius={100}
              falloff="exponential"
              style={{ fontFamily: "'Savate', sans-serif" }}
            />
          </div>
          {/* Subheading */}
          <p className="text-lg text-gray-500 mt-12 mb-8">Join our waitlist to be notified when we launch and receive exclusive early access.</p>
          {/* Waitlist Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-12 max-w-md">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="flex-1 border border-gray-300 bg-white text-gray-900 text-base placeholder:text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 px-3 py-5"
            />
            <Button
              type="submit"
              className="bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors px-5 py-5"
              disabled={isLoading}
            >
              {isLoading ? "Joining..." : "Join waitlist"}
            </Button>
          </form>
          {/* Features */}
          <div className="space-y-6 mb-8">
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Tailored Resume</h3>
              <p className="text-gray-500">Highlight your most relevant skills and achievements. Our AI builds a new resume for every job — no editing needed.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Custom Answers</h3>
              <p className="text-gray-500">Paste any job description and get instant, thoughtful responses for application questions — in your own voice.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Stay on Top of Your Job Hunt</h3>
              <p className="text-gray-500">Keep track of where you've applied, what you sent, and what's next — all in one clean, organized dashboard.</p>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="flex w-full justify-between text-xs text-gray-400 mt-8">
          <span>
            Designed and built by <a href="https://ilyazoria.design/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Ilya Zoria</a>
          </span>
          <a href="https://www.tiktok.com/@resume.builder.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">TikTok</a>
        </div>
      </div>
      {/* Right Column */}
      <div className="hidden md:block w-full md:w-1/2 h-full min-h-screen">
        <img src="/waitlist-photo.png" alt="Waitlist visual" className="object-cover w-full h-full min-h-screen" />
      </div>
    </div>
  );
} 