import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Success() {
  return (
    <div className="flex items-center justify-center p-4 w-full h-full">
      <div className="w-full max-w-md p-12 text-center">
        <div className="flex flex-col items-center space-y-6">
          <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExd3l6eTV1YWV5a2U1cTZ0a3VraXY1amtza2g5Y29wNTBzbDRjMnVtcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hr4Ljjyj0L9RYlihLr/giphy.gif" alt="Success" className="w-60 h-60 object-contain mx-auto rounded-2xl" />
          {/* <h1 className="text-5xl md:text-7xl italic leading-tight text-gray-900" style={{ fontFamily: 'Savate, sans-serif' }}>Welcome Aboard!</h1> */}
          <p className="text-lg text-gray-500 mt-12 mb-8">Thank you for joining our waitlist. We'll keep you updated on our progress and let you know as soon as we launch.
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
      </div>
    </div>
  );
} 