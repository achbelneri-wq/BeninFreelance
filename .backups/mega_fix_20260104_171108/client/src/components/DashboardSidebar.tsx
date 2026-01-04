import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Briefcase,
  Wallet,
  Settings,
  Heart,
  FileText,
  User,
  ShieldCheck,
  Users,
  Activity,
  X
} from "lucide-react";

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { canAccessAdminDashboard, canManageKYC } = useRBAC();

  // ✅ CORRECTION: Utiliser is_seller au lieu de isSeller
  const isSeller = user?.is_seller;

  const isActive = (path: string) => location === path;

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // ✅ CORRECTION CRITIQUE: Positionnement fixed pour rester à gauche
          "fixed top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out",
          "w-64 border-r bg-card flex flex-col overflow-y-auto",
          "lg:translate-x-0", // Toujours visible sur desktop
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0" // Mobile: caché par défaut
        )}
        style={{ 
          background: '#FFFDFB',
          borderRight: '1px solid #E8E2D9'
        }}
      >
        {/* Bouton fermer (mobile uniquement) */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" style={{ color: '#6B6560' }} />
          </button>
        </div>

        {/* Menu principal */}
        <div className="p-4 space-y-1">
          <Link href="/dashboard">
            <a
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/dashboard")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={isActive("/dashboard") ? {
                background: 'rgba(199, 91, 57, 0.1)',
                color: '#C75B39'
              } : {}}
            >
              <LayoutDashboard className="h-4 w-4" />
              Vue d'ensemble
            </a>
          </Link>
          <Link href="/dashboard/messages">
            <a
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/dashboard/messages")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={isActive("/dashboard/messages") ? {
                background: 'rgba(199, 91, 57, 0.1)',
                color: '#C75B39'
              } : {}}
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </a>
          </Link>
          <Link href="/dashboard/orders">
            <a
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/dashboard/orders")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={isActive("/dashboard/orders") ? {
                background: 'rgba(199, 91, 57, 0.1)',
                color: '#C75B39'
              } : {}}
            >
              <ShoppingBag className="h-4 w-4" />
              Commandes
            </a>
          </Link>
          <Link href="/dashboard/favorites">
            <a
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/dashboard/favorites")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={isActive("/dashboard/favorites") ? {
                background: 'rgba(199, 91, 57, 0.1)',
                color: '#C75B39'
              } : {}}
            >
              <Heart className="h-4 w-4" />
              Favoris
            </a>
          </Link>
          <Link href="/dashboard/wallet">
            <a
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/dashboard/wallet")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={isActive("/dashboard/wallet") ? {
                background: 'rgba(199, 91, 57, 0.1)',
                color: '#C75B39'
              } : {}}
            >
              <Wallet className="h-4 w-4" />
              Portefeuille
            </a>
          </Link>
        </div>

        {/* Section Freelance */}
        <div className="px-4 mt-6 mb-2 text-xs font-semibold" style={{ color: '#9A948D' }}>
          FREELANCE
        </div>
        <div className="p-4 pt-0 space-y-1">
          {isSeller ? (
            <>
              <Link href="/dashboard/services">
                <a
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive("/dashboard/services")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  style={isActive("/dashboard/services") ? {
                    background: 'rgba(199, 91, 57, 0.1)',
                    color: '#C75B39'
                  } : {}}
                >
                  <Briefcase className="h-4 w-4" />
                  Mes Services
                </a>
              </Link>
            </>
          ) : (
            <Link href="/become-seller">
              <a 
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Briefcase className="h-4 w-4" />
                Devenir Vendeur
              </a>
            </Link>
          )}
        </div>

        {/* Section Admin (si autorisé) */}
        {canAccessAdminDashboard() && (
          <>
            <div className="px-4 mt-6 mb-2 text-xs font-semibold text-red-500">
              ADMINISTRATION
            </div>
            <div className="p-4 pt-0 space-y-1">
              <Link href="/admin/dashboard">
                <a
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive("/admin/dashboard")
                      ? "bg-red-50 text-red-600"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Activity className="h-4 w-4" />
                  Vue d'ensemble
                </a>
              </Link>
              <Link href="/admin/users">
                <a
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive("/admin/users")
                      ? "bg-red-50 text-red-600"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Utilisateurs
                </a>
              </Link>
              {canManageKYC() && (
                <Link href="/admin/kyc">
                  <a
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive("/admin/kyc")
                        ? "bg-red-50 text-red-600"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Validation KYC
                  </a>
                </Link>
              )}
            </div>
          </>
        )}

        {/* Paramètres (en bas) */}
        <div className="mt-auto p-4 border-t" style={{ borderTop: '1px solid #E8E2D9' }}>
          <Link href="/dashboard/settings">
            <a
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/dashboard/settings")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={isActive("/dashboard/settings") ? {
                background: 'rgba(199, 91, 57, 0.1)',
                color: '#C75B39'
              } : {}}
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </a>
          </Link>
        </div>
      </aside>
    </>
  );
}