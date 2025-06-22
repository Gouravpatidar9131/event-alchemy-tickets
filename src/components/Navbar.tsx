
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Home, Search, Ticket, User, LogOut } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import WalletButton from './WalletButton';

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Ticket className="h-8 w-8 text-solana-purple" />
          <Link to="/" className="text-2xl font-bold text-gradient">BlockTix</Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
          <Link to="/events" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <CalendarDays className="h-4 w-4 mr-1" />
            Events
          </Link>
          <Link to="/explore" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <Search className="h-4 w-4 mr-1" />
            Explore
          </Link>
          <Link to="/dashboard" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <User className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <WalletButton />
          {user ? (
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
