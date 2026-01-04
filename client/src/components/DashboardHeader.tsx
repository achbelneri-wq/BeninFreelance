import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Home,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function DashboardHeader({ onMenuClick, title }: DashboardHeaderProps) {
  // ✅ CORRECTION MAJEURE: Récupérer profile en plus de user
  const { user, profile, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      } catch (e) {
        console.log("Système de notification non initialisé");
      }
    };

    fetchNotifications();
  }, [user]);

  const markAllAsRead = async () => {
    try {
      if (user) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id);
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (e) {
      console.error("Erreur markAllAsRead", e);
    }
  };

  // ✅ CORRECTION CRITIQUE: Utiliser profile au lieu de user.metadata
  const displayName = profile?.name || user?.email?.split('@')[0] || "Utilisateur";
  const displayAvatar = profile?.avatar_url;
  
  // ✅ CORRECTION: Extraire la première lettre du NOM complet
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    
    // Si le nom contient un espace, prendre les initiales des 2 premiers mots
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    
    // Sinon, prendre les 2 premières lettres du nom
    return name.substring(0, 2).toUpperCase();
  };
  
  const displayInitial = getInitials(displayName);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/services?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // ✅ CORRECTION CRITIQUE: Utiliser profile.id pour le lien profil
  const profileLink = profile?.id ? `/profile/${profile.id}` : '#';

  return (
    <header 
      className="sticky top-0 z-30 backdrop-blur-xl h-16 flex items-center px-4 lg:px-6" 
      style={{ 
        background: 'rgba(255, 253, 251, 0.95)', 
        borderBottom: '1px solid #E8E2D9' 
      }}
    >
      {/* Mobile: Menu Hamburger + Bouton Retour */}
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[48px] min-w-[48px]"
          style={{ color: '#6B6560' }}
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Bouton retour accueil TOUJOURS visible sur mobile */}
        <Link href="/">
          <Button 
            variant="ghost" 
            size="icon" 
            className="min-h-[48px] min-w-[48px]"
            style={{ color: '#C75B39' }}
            title="Retour à l'accueil"
          >
            <Home className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Desktop: Title or Search */}
      <div className="flex-1 flex items-center gap-4">
        {title && (
          <h1 
            className="font-semibold text-lg hidden lg:block" 
            style={{ 
              fontFamily: 'Playfair Display, serif', 
              color: '#1A1714' 
            }}
          >
            {title}
          </h1>
        )}

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" 
              style={{ color: '#9A948D' }} 
            />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-10 h-10 rounded-sm"
              style={{ 
                background: '#FAF7F2', 
                border: '1px solid #E8E2D9', 
                color: '#1A1714' 
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* ✅ CORRECTION: is_seller au lieu de isSeller */}
        {profile?.is_seller && (
          <Link href="/dashboard/services/new">
            <Button 
              size="sm" 
              className="hidden sm:flex rounded-sm min-h-[44px]" 
              style={{ background: '#C75B39', color: '#FFFDFB' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          </Link>
        )}

        {/* Desktop: Home Link */}
        <Link href="/">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden lg:flex rounded-sm min-h-[44px] min-w-[44px]" 
            style={{ color: '#6B6560' }}
          >
            <Home className="h-5 w-5" />
          </Button>
        </Link>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative rounded-sm min-h-[44px] min-w-[44px]" 
              style={{ color: '#6B6560' }}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium" 
                  style={{ background: '#C75B39', color: '#FFFDFB' }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-80" 
            style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}
          >
            <div 
              className="flex items-center justify-between px-3 py-2" 
              style={{ borderBottom: '1px solid #E8E2D9' }}
            >
              <span className="font-medium" style={{ color: '#1A1714' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-auto py-1"
                  style={{ color: '#C75B39' }}
                  onClick={markAllAsRead}
                >
                  Tout marquer lu
                </Button>
              )}
            </div>
            {notifications && notifications.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <DropdownMenuItem key={notif.id} asChild>
                    <Link 
                      href={notif.link || "#"} 
                      className="flex flex-col gap-1 p-3 cursor-pointer"
                      style={{ 
                        background: !notif.is_read ? 'rgba(199, 91, 57, 0.05)' : 'transparent' 
                      }}
                    >
                      <span 
                        className="font-medium text-sm" 
                        style={{ color: '#1A1714' }}
                      >
                        {notif.title}
                      </span>
                      {notif.content && (
                        <span 
                          className="text-xs line-clamp-2" 
                          style={{ color: '#6B6560' }}
                        >
                          {notif.content}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            ) : (
              <div 
                className="p-4 text-center text-sm" 
                style={{ color: '#6B6560' }}
              >
                Aucune notification
              </div>
            )}
            <DropdownMenuSeparator style={{ background: '#E8E2D9' }} />
            <DropdownMenuItem asChild>
              <Link 
                href="/dashboard/notifications" 
                className="w-full text-center text-sm" 
                style={{ color: '#C75B39' }}
              >
                Voir toutes les notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 px-2 rounded-sm min-h-[44px]" 
              style={{ color: '#3D3833' }}
            >
              <Avatar 
                className="h-8 w-8" 
                style={{ border: '2px solid rgba(199, 91, 57, 0.2)' }}
              >
                {/* ✅ CORRECTION: Utiliser displayAvatar de profile */}
                <AvatarImage src={displayAvatar || undefined} alt={displayName} />
                <AvatarFallback 
                  className="text-sm font-semibold" 
                  style={{ 
                    background: 'rgba(199, 91, 57, 0.1)', 
                    color: '#C75B39' 
                  }}
                >
                  {displayInitial}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56" 
            style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}
          >
            <div className="px-3 py-2">
              <p className="font-medium" style={{ color: '#1A1714' }}>
                {displayName}
              </p>
              <p className="text-sm" style={{ color: '#6B6560' }}>
                {user?.email}
              </p>
            </div>
            <DropdownMenuSeparator style={{ background: '#E8E2D9' }} />
            
            {/* Retour à l'accueil */}
            <DropdownMenuItem asChild>
              <Link 
                href="/" 
                className="flex items-center gap-2 cursor-pointer" 
                style={{ color: '#3D3833' }}
              >
                <Home className="h-4 w-4" />
                Accueil
              </Link>
            </DropdownMenuItem>
            
            {/* ✅ CORRECTION CRITIQUE: Utiliser profile.id au lieu de user.id */}
            <DropdownMenuItem asChild>
              <Link 
                href={profileLink}
                className="flex items-center gap-2 cursor-pointer" 
                style={{ color: '#3D3833' }}
              >
                <User className="h-4 w-4" />
                Mon Profil
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link 
                href="/dashboard/settings" 
                className="flex items-center gap-2 cursor-pointer" 
                style={{ color: '#3D3833' }}
              >
                <Settings className="h-4 w-4" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator style={{ background: '#E8E2D9' }} />
            
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="flex items-center gap-2 cursor-pointer"
              style={{ color: '#C75B39' }}
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}