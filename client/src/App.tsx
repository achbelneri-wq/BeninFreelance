import { Switch, Route, Router, Redirect } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useRBAC } from "@/hooks/useRBAC";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

// Components
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import DashboardLayout from "@/pages/DashboardLayout";

// Public Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import PublicProjects from "@/pages/PublicProjects";
import Profile from "@/pages/Profile";
import BecomeSeller from "@/pages/BecomeSeller";
import HowItWorks from "@/pages/HowItWorks";
import Help from "@/pages/Help";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Cookies from "@/pages/Cookies";
import NotFound from "@/pages/NotFound";
import FreelanceProfile from "@/pages/FreelanceProfile";
import AllProjects from "@/pages/AllProjects";
import FindFreelancers from "@/pages/FindFreelancers";
import VerifyEmail from "@/pages/VerifyEmail";
import Portfolio from "@/pages/Portfolio";
import ProjectDetailPro from "@/pages/ProjectDetailPro";
import MyProposals from "@/pages/MyProposals";
import ProjectOrders from "@/pages/ProjectOrders";
import Reviews from "@/pages/Reviews";

// Dashboard Pages
import Dashboard from "@/pages/Dashboard";
import DashboardServices from "@/pages/DashboardServices";
import CreateService from "@/pages/CreateService";
import CreateProject from "@/pages/CreateProject";
import DashboardOrders from "@/pages/DashboardOrders";
import DashboardMessages from "@/pages/DashboardMessages";
import DashboardSettings from "@/pages/DashboardSettings";
import Wallet from "@/pages/Wallet";
import Favorites from "@/pages/Favorites";

// Admin Pages
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminKYC from "@/pages/AdminKYC";

// 🛡️ Gardien de sécurité Admin
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { canAccessAdminDashboard, isLoading, isAuthenticated } = useRBAC();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!canAccessAdminDashboard()) return <Redirect to="/" />;

  return <>{children}</>;
};

function RouterContent() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/services" component={Services} />
      <Route path="/services/:id" component={ServiceDetail} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/all" component={AllProjects} />
      <Route path="/projects/public" component={PublicProjects} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/profile/edit" component={FreelanceProfile} />
      <Route path="/freelance/profile" component={FreelanceProfile} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/help" component={Help} />
      <Route path="/faq" component={FAQ} />
      <Route path="/contact" component={Contact} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/cookies" component={Cookies} />
      
      {/* Nouvelles pages pro */}
      <Route path="/freelancers" component={FindFreelancers} />
      <Route path="/freelancers/:id" component={Profile} />
      <Route path="/portfolio/:userId" component={Portfolio} />
      <Route path="/project/:id" component={ProjectDetailPro} />
      <Route path="/my-proposals" component={MyProposals} />
      <Route path="/project-orders" component={ProjectOrders} />
      <Route path="/project-orders/:id" component={ProjectOrders} />
      <Route path="/reviews/:userId" component={Reviews} />
      <Route path="/review/:orderId" component={Reviews} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" component={() => (
        <DashboardLayout><Dashboard /></DashboardLayout>
      )} />
      <Route path="/dashboard/services" component={() => (
        <DashboardLayout><DashboardServices /></DashboardLayout>
      )} />
      <Route path="/dashboard/services/new" component={() => (
        <DashboardLayout><CreateService /></DashboardLayout>
      )} />
      <Route path="/dashboard/services/:id/edit" component={() => (
        <DashboardLayout><CreateService /></DashboardLayout>
      )} />
      <Route path="/dashboard/projects/new" component={() => (
        <DashboardLayout><CreateProject /></DashboardLayout>
      )} />
      <Route path="/dashboard/projects/:id/edit" component={() => (
        <DashboardLayout><CreateProject /></DashboardLayout>
      )} />
      <Route path="/dashboard/orders" component={() => (
        <DashboardLayout><DashboardOrders /></DashboardLayout>
      )} />
      <Route path="/dashboard/messages" component={() => (
        <DashboardLayout><DashboardMessages /></DashboardLayout>
      )} />
      <Route path="/dashboard/settings" component={() => (
        <DashboardLayout><DashboardSettings /></DashboardLayout>
      )} />
      <Route path="/become-seller" component={() => (
        <DashboardLayout><BecomeSeller /></DashboardLayout>
      )} />
      <Route path="/dashboard/wallet" component={() => (
        <DashboardLayout><Wallet /></DashboardLayout>
      )} />
      <Route path="/dashboard/favorites" component={() => (
        <DashboardLayout><Favorites /></DashboardLayout>
      )} />
      <Route path="/favorites" component={() => (
        <DashboardLayout><Favorites /></DashboardLayout>
      )} />

      {/* 🛡️ Protected Admin Routes */}
      <Route path="/admin/dashboard" component={() => (
        <AdminGuard><AdminDashboard /></AdminGuard>
      )} />
      <Route path="/admin/users" component={() => (
        <AdminGuard><AdminUsers /></AdminGuard>
      )} />
      <Route path="/admin/kyc" component={() => (
        <AdminGuard><AdminKYC /></AdminGuard>
      )} />

      {/* Legacy Redirects */}
      <Route path="/admin"><Redirect to="/admin/dashboard" /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isReady, setIsReady] = useState(false);

  // Initialisation Auth
  useEffect(() => {
    supabase.auth.getSession().then(() => {
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF7F2]">
        <Loader2 className="h-10 w-10 animate-spin text-[#C75B39]" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#FFFDFB',
                border: '1px solid #E8E2D9',
                color: '#1A1714',
              },
            }}
          />
          <Router>
            <ScrollToTop />
            <RouterContent />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;