import { useNavigate } from 'react-router-dom';
import { auth } from '@/services/auth';
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import {
  MessageCircle,
  Map,
  LogOut,
  User,
  Menu
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout({ children }) {
  const navigate = useNavigate();
  const user = auth.getUser();

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="h-8">
          <User className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/chat')}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/plan')}>
          <Map className="h-4 w-4 mr-2" />
          Plans
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const MobileNav = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => navigate('/chat')}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/plan')}>
          <Map className="h-4 w-4 mr-2" />
          Plans
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between max-w-6xl mx-auto px-4">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-4">
            <h1 
              onClick={() => navigate('/chat')} 
              className="text-lg md:text-xl font-semibold hover:opacity-80 cursor-pointer whitespace-nowrap"
            >
              Travel Planner
            </h1>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/chat')}
                className="text-sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/plan')}
                className="text-sm"
              >
                <Map className="h-4 w-4 mr-2" />
                Plan
              </Button>
            </nav>
          </div>

          {/* User Section */}
          {user && (
            <div className="flex items-center space-x-2">
              {/* Mobile Navigation */}
              <MobileNav />
              {/* User Menu */}
              <UserMenu />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
      <Toaster />
    </div>
  );
}