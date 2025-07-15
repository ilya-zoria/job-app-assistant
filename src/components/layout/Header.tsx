import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logo from '/assets/logo.svg';
import { supabase } from '@/lib/supabaseClient';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


interface HeaderProps {
  variant?: 'default' | 'resume-builder';
  onDownload?: () => void;
}

const Header: React.FC<HeaderProps> = ({ variant = 'default', onDownload }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setIsLoggedIn(!!userData?.user);
      setUser(userData?.user || null);
      setUserName(userData?.user?.user_metadata?.full_name || userData?.user?.email || null);
    };
    checkUser();
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Show logged-in header on builder page if logged in
  if ((variant === 'resume-builder' || variant === 'default') && isLoggedIn) {
    return (
      <header className="w-full py-8 px-4 md:px-8">
        <div className="mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/">
              <img src={logo} className="h-10" />
            </Link>
          </div>
          <div className="flex gap-4 items-center">
            <Button variant="outline">Upgrade</Button>
            {variant === 'resume-builder' && onDownload && (
              <Button variant="default" type="button" onClick={onDownload}>Download</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(user?.email || user?.id || 'guest')}`} />
                  <AvatarFallback>{userName ? userName[0] : 'U'}</AvatarFallback>
                </Avatar>
                {/* <Button>{userName}</Button> */}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 mt-2">

                <DropdownMenuItem>My Account</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );
  }

  // Not logged in, show Download button with /builder redirect or login/signup
  return (
    <header className="w-full py-8 px-4 md:px-8">
      <div className="mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/">
            <img src={logo} className="h-10" />
          </Link>
        </div>
        {variant === 'resume-builder' ? (
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/signup?redirect=/builder">Download</Link>
            </Button>
          </div>
        ) : (
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild><Link to="/login">Log in</Link></Button>
          <Button asChild><Link to="/signup">Sign up</Link></Button>
        </div>
        )}
      </div>
    </header>
  );
};

export default Header; 