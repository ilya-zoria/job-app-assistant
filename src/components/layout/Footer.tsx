import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 px-4 md:px-8 bg-background">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/tiktok" className="text-muted-foreground hover:text-primary transition-colors">Tiktok</Link>
          <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
          <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link>
        </div>
        <div className="text-muted-foreground">
          By Ilya Zoria
        </div>
      </div>
    </footer>
  );
};

export default Footer; 