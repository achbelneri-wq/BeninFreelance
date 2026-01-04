import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { loading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // ✅ CORRECTION CRITIQUE: Éviter la boucle infinie de redirection
  useEffect(() => {
    if (!loading && !isAuthenticated && !redirecting) {
      setRedirecting(true);
      // Utiliser un délai pour éviter les multiples appels
      const timer = setTimeout(() => {
        window.location.href = getLoginUrl();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated, redirecting]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF7F2' }}>
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-4" style={{ background: '#C75B39' }}>
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#FFFDFB' }} />
            </div>
          </div>
          <p style={{ color: '#6B6560' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  // ✅ CORRECTION: Afficher loading pendant la redirection au lieu de null
  if (!isAuthenticated || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF7F2' }}>
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-4" style={{ background: '#C75B39' }}>
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#FFFDFB' }} />
            </div>
          </div>
          <p style={{ color: '#6B6560' }}>Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF7F2' }}>
      {/* Sidebar */}
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Header */}
        <DashboardHeader 
          onMenuClick={() => setSidebarOpen(true)} 
          title={title}
        />

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}