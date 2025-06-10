import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Join the Waitlist
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Be among the first to experience our job application assistant. Sign up now to get early access and exclusive updates.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Smart Applications</h3>
            <p className="text-gray-600">
              Our AI-powered assistant helps you craft the perfect job application tailored to each position.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Time Saving</h3>
            <p className="text-gray-600">
              Automate repetitive tasks and focus on what matters most - landing your dream job.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Early Access</h3>
            <p className="text-gray-600">
              Get exclusive access to new features and provide feedback to shape the future of our platform.
            </p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Get Early Access
            </h2>
            <p className="text-gray-600">
              Join our waitlist to be notified when we launch and receive exclusive early access.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Joining..." : "Join Waitlist"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
} 