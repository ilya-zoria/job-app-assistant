import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Success() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h1 className="text-3xl font-bold text-gray-900">Welcome Aboard!</h1>
          <p className="text-gray-600">
            Thank you for joining our waitlist. We'll keep you updated on our progress and let you know as soon as we launch.
          </p>
          <div className="pt-4">
            <Link to="/">
              <Button variant="outline">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
} 