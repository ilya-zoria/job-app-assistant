import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Success() {
  return (
    <div className="bg-gradient-to-b from-muted-background to-background flex items-center justify-center p-4 w-full h-full">
      <Card className="w-full max-w-md p-12 text-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex flex-col items-center space-y-6">
          <CheckCircle className="h-20 w-20 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Welcome Aboard!</h1>
          <p className="text-muted text-lg">
            Thank you for joining our waitlist. We'll keep you updated on our progress and let you know as soon as we launch.
          </p>
          <div className="pt-6">
            <Link to="/">
              <Button 
                className="h-12 px-8 text-base bg-primary hover:bg-primary-hover"
              >
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
} 