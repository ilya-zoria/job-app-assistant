import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logo from '/assets/logo.svg';

interface HeaderProps {
  variant?: 'default' | 'resume-builder';
  onDownload?: () => void;
}

const Header: React.FC<HeaderProps> = ({ variant = 'default', onDownload }) => {
  return (
    <header className="w-full py-4 px-4 md:px-8 bg-background border-b border-border mb-8">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/">
            <img src={logo} className="h-10" />
          </Link>
        </div>
        {variant === 'resume-builder' ? (
          <div className="flex gap-2">
            <Button variant="outline">Tailor for job</Button>
            <Button onClick={onDownload}>Download</Button>
          </div>
        ) : (
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
              <Link to="/login" className="text-foreground hover:text-primary transition-colors font-medium">
              Login
            </Link>
          </Button>
            <Button asChild>
              <Link to="/signup">
                Sign up
            </Link>
          </Button>
        </div>
        )}
      </div>
    </header>
  );
};

export default Header; 