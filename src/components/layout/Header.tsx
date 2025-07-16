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
  // For resume-builder variant:
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  editingTitle?: boolean;
  setEditingTitle?: (editing: boolean) => void;
  showAppIcon?: boolean;
  titleInputRef?: React.RefObject<HTMLInputElement>;
}

const Header: React.FC<HeaderProps> = ({ variant = 'default', onDownload, title, onTitleChange, editingTitle, setEditingTitle, showAppIcon = false, titleInputRef }) => {
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
    if (variant === 'resume-builder') {
      // Resume builder header with editable title
      return (
        <header className="w-full py-6 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="mr-2 p-2 rounded hover:bg-gray-200"
              onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign('/')} // Go back
              aria-label="Back"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <div className="ml-2 flex-1">
              {editingTitle && setEditingTitle && onTitleChange ? (
                <input
                  ref={titleInputRef}
                  className="text-xl md:text-xl font-sans bg-transparent focus:border-black outline-none px-1 py-0.5 min-w-[120px]"
                  value={title || ''}
                  onChange={e => onTitleChange(e.target.value)}
                  onBlur={e => { setEditingTitle(false); onTitleChange(e.target.value.trim() || 'Untitled resume'); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setEditingTitle(false);
                      onTitleChange((e.target as HTMLInputElement).value.trim() || 'Untitled resume');
                    }
                  }}
                  maxLength={64}
                />
              ) : (
                <span
                  className="text-2xl md:text-3xl font-bold font-sans cursor-pointer hover:underline"
                  onClick={() => setEditingTitle && setEditingTitle(true)}
                  title="Click to edit resume name"
                >
                  {title || 'Untitled resume'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 ml-auto">
              {onDownload && <Button variant="default" type="button" onClick={onDownload}>Download</Button>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(user?.email || user?.id || 'guest')}`} />
                    <AvatarFallback>{userName ? userName[0] : 'U'}</AvatarFallback>
                  </Avatar>
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
    // Default header for non-builder pages
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(user?.email || user?.id || 'guest')}`} />
                  <AvatarFallback>{userName ? userName[0] : 'U'}</AvatarFallback>
                </Avatar>
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