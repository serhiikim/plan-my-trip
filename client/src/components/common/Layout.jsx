// src/components/common/Layout.jsx
import { useNavigate } from 'react-router-dom';
import { auth } from '@/services/auth';
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import {
  MessageCircle,
  Map,
  LogOut,
  User
} from "lucide-react";

export function Layout({ children }) {
  const navigate = useNavigate();
  const user = auth.getUser();

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between max-w-6xl mx-auto px-4">
          <div className="flex items-center space-x-4">
            <h1 
              onClick={() => navigate('/chat')} 
              className="text-xl font-semibold hover:opacity-80 cursor-pointer"
            >
              Travel Planner
            </h1>
            <nav className="flex items-center space-x-1">
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
          {user && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 rounded-full bg-secondary px-3 py-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
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