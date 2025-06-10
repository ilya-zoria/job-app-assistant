import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  return (
    <header className="w-full py-4 px-4 md:px-8 bg-background border-b border-border">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left Section: Nav Links */}
        <nav className="flex items-center space-x-6">
          <Link to="/company" className="text-foreground hover:text-primary transition-colors text-lg font-medium">
            Company
          </Link>
          <Link to="/pricing" className="text-foreground hover:text-primary transition-colors text-lg font-medium">
            Pricing
          </Link>
        </nav>

        {/* Center Section: Logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="text-2xl font-bold text-foreground">
            Talentium
          </Link>
        </div>

        {/* Right Section: Buttons */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/login" className="text-foreground hover:text-primary transition-colors text-lg font-medium">
              Login
            </Link>
          </Button>
          <Button asChild className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg text-lg font-medium">
            <Link to="/book-a-demo">
              Book a demo
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header; 