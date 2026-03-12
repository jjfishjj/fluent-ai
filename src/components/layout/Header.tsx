import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, LayoutDashboard, Menu, X, Globe } from 'lucide-react';

interface HeaderProps {
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  userName?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function Header({ 
  isLoggedIn = false, 
  isAdmin = false, 
  userName = 'User',
  onLogin,
  onLogout 
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow">
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">LinguaAI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/">
              <Button 
                variant={isActive('/') ? 'secondary' : 'ghost'} 
                size="sm"
              >
                Home
              </Button>
            </Link>
            <Link to="/practice">
              <Button 
                variant={isActive('/practice') ? 'secondary' : 'ghost'} 
                size="sm"
              >
                Practice
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button 
                  variant={isActive('/admin') ? 'secondary' : 'ghost'} 
                  size="sm"
                >
                  <LayoutDashboard className="w-4 h-4 mr-1" />
                  Admin
                </Button>
              </Link>
            )}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-semibold">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {userName}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onLogin}>
                  Sign In
                </Button>
                <Button variant="gradient" size="sm" onClick={onLogin}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up">
            <nav className="flex flex-col gap-2">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant={isActive('/') ? 'secondary' : 'ghost'} className="w-full justify-start">
                  Home
                </Button>
              </Link>
              <Link to="/practice" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant={isActive('/practice') ? 'secondary' : 'ghost'} className="w-full justify-start">
                  Practice
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant={isActive('/admin') ? 'secondary' : 'ghost'} className="w-full justify-start">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              <div className="pt-4 border-t border-border/50 mt-2">
                {isLoggedIn ? (
                  <Button variant="destructive" className="w-full" onClick={onLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                ) : (
                  <Button variant="gradient" className="w-full" onClick={onLogin}>
                    Sign In with Google
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
