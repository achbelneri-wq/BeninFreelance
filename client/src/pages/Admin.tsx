import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
// SUPPRIMÉ: import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase"; // AJOUT
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Users,
  Briefcase,
  ShoppingCart,
  DollarSign,
  Shield,
  Search,
  UserCheck,
  UserX,
  Eye,
  Check,
  X,
  AlertTriangle,
  Activity,
  Crown,
  Star,
  Ban,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  UserPlus,
  FolderOpen,
  Gavel
} from "lucide-react";
import Logo from "@/components/Logo";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [kycFilter, setKycFilter] = useState<string>("pending");

  // États de données (Remplacement des hooks tRPC)
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [moderators, setModerators] = useState<any[]>([]);
  const [kycDocuments, setKycDocuments] = useState<any[]>([]);
  const [pendingKYCCount, setPendingKYCCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has admin access
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'moderator';
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdminOrSuper = user?.role === 'admin' || user?.role === 'superadmin';

  // --- FETCHING FUNCTIONS ---

  const fetchStats = async () => {
    try {
      const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: totalFreelancers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_seller', true);
      const { count: totalServices } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: activeProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'open');
      const { count: pendingKYC } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending');
      
      // Simulation revenus (somme des commandes complétées)
      const { data: orders } = await supabase.from('orders').select('price').eq('status', 'completed');
      const totalRevenue = orders?.reduce((acc, o) => acc + (o.price || 0), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalFreelancers: totalFreelancers || 0,
        totalServices: totalServices || 0,
        activeProjects: activeProjects || 0,
        pendingKYC: pendingKYC || 0,
        pendingDisputes: 0, // Placeholder si pas de table disputes
        totalRevenue
      });
      setPendingKYCCount(pendingKYC || 0);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      let query = supabase.from('users').select('*').order('created_at', { ascending: false });
      
      if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
      if (roleFilter !== 'all') query = query.eq('role', roleFilter);
      if (userTypeFilter !== 'all') {
        const isSeller = userTypeFilter === 'freelance';
        query = query.eq('is_seller', isSeller);
      }

      const { data } = await query.limit(100);
      setUsers(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchServices = async () => {
    try {
      // Services à modérer (ex: pending ou active pour contrôle)
      const { data } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setServices(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setProjects(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setTransactions(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchModerators = async () => {
    try {
      const { data } = await supabase.from('users').select('*').eq('role', 'moderator');
      setModerators(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchKYC = async () => {
    try {
      let query = supabase.from('users').select('*').not('kyc_status', 'is', null);
      if (kycFilter !== 'all') query = query.eq('kyc_status', kycFilter);
      
      const { data } = await query.order('created_at', { ascending: false });
      
      // Mapping pour matcher l'interface attendue
      const mappedDocs = data?.map(u => ({
        id: u.id,
        user: u,
        status: u.kyc_status,
        documentType: 'ID Card', // Placeholder
        documentUrl: u.kyc_document_url, // Assurez-vous que cette colonne existe
        createdAt: u.kyc_submitted_at || u.created_at
      })) || [];
      
      setKycDocuments(mappedDocs);
    } catch (e) { console.error(e); }
  };

  // Chargement initial
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
      if (activeTab === 'services') fetchServices();
      if (activeTab === 'projects') fetchProjects();
      if (activeTab === 'transactions') fetchTransactions();
      if (activeTab === 'moderators') fetchModerators();
      if (activeTab === 'kyc') fetchKYC();
    }
  }, [activeTab, isAdmin, searchQuery, roleFilter, userTypeFilter, kycFilter]);


  // --- MUTATIONS ---

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await supabase.from('users').update({ role: newRole }).eq('id', userId);
      toast.success("Rôle mis à jour");
      fetchUsers();
    } catch (e: any) { toast.error(e.message); }
  };

  const confirmBan = async () => {
    if (!selectedUser) return;
    try {
      const newBanStatus = !selectedUser.is_banned; // DB: is_banned (snake_case)
      await supabase.from('users').update({ is_banned: newBanStatus }).eq('id', selectedUser.id);
      
      toast.success(`Utilisateur ${newBanStatus ? 'banni' : 'débanni'}`);
      setBanDialogOpen(false);
      fetchUsers();
    } catch (e: any) { toast.error(e.message); }
  };

  const moderateService = async (serviceId: number, action: 'approve' | 'pause') => {
    try {
      const status = action === 'approve' ? 'active' : 'paused';
      await supabase.from('services').update({ status }).eq('id', serviceId);
      toast.success(`Service ${status}`);
      fetchServices();
    } catch (e: any) { toast.error(e.message); }
  };

  const processTransaction = async (txId: number, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'completed' : 'failed';
      await supabase.from('transactions').update({ status }).eq('id', txId);
      toast.success("Transaction mise à jour");
      fetchTransactions();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleKYCDecision = async (userId: string, decision: 'approved' | 'rejected') => {
    try {
      const status = decision === 'approved' ? 'verified' : 'rejected';
      await supabase.from('users').update({ kyc_status: status }).eq('id', userId);
      toast.success(`KYC ${status}`);
      fetchKYC();
      fetchStats(); // Update counters
    } catch (e: any) { toast.error(e.message); }
  };


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF7F2' }}>
        <Card className="p-8 text-center" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
          <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: '#C75B39' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
            Accès restreint
          </h2>
          <p className="mb-6" style={{ color: '#6B6560' }}>
            Vous devez être connecté pour accéder à cette page.
          </p>
          <Link href="/login">
            <Button style={{ background: '#C75B39', color: '#FFFDFB' }}>
              Se connecter
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF7F2' }}>
        <Card className="p-8 text-center" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
          <AlertTriangle className="w-16 h-16 mx-auto mb-4" style={{ color: '#C75B39' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
            Accès non autorisé
          </h2>
          <p className="mb-6" style={{ color: '#6B6560' }}>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <Link href="/">
            <Button style={{ background: '#C75B39', color: '#FFFDFB' }}>
              Retour à l'accueil
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return { label: 'Super Admin', bg: 'rgba(139, 69, 19, 0.1)', color: '#8B4513', icon: Crown };
      case 'admin':
        return { label: 'Admin', bg: 'rgba(199, 91, 57, 0.1)', color: '#C75B39', icon: Shield };
      case 'moderator':
        return { label: 'Modérateur', bg: 'rgba(92, 107, 74, 0.1)', color: '#5C6B4A', icon: Star };
      default:
        return { label: 'Utilisateur', bg: '#E8E2D9', color: '#6B6560', icon: Users };
    }
  };

  const getKYCStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return { label: 'Vérifié', bg: 'rgba(92, 107, 74, 0.1)', color: '#5C6B4A', icon: CheckCircle };
      case 'pending':
        return { label: 'En attente', bg: 'rgba(199, 91, 57, 0.1)', color: '#C75B39', icon: Clock };
      case 'rejected':
        return { label: 'Rejeté', bg: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', icon: XCircle };
      default:
        return { label: 'Non soumis', bg: '#E8E2D9', color: '#6B6560', icon: AlertCircle };
    }
  };

  const handleBanUser = (user: any) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  return (
    <div className="min-h-screen" style={{ background: '#FAF7F2' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 py-4" style={{ background: '#FFFDFB', borderBottom: '1px solid #E8E2D9' }}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Logo />
            </Link>
            <Badge className="rounded-sm" style={{ background: 'rgba(199, 91, 57, 0.1)', color: '#C75B39' }}>
              <Shield className="w-3 h-3 mr-1" />
              Administration
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: '#6B6560' }}>
              Connecté en tant que <strong style={{ color: '#1A1714' }}>{user?.name}</strong>
            </span>
            {(() => {
              const badge = getRoleBadge(user?.role || 'user');
              return (
                <Badge className="rounded-sm" style={{ background: badge.bg, color: badge.color }}>
                  <badge.icon className="w-3 h-3 mr-1" />
                  {badge.label}
                </Badge>
              );
            })()}
            <Link href="/dashboard">
              <Button variant="outline" size="sm" style={{ borderColor: '#E8E2D9' }}>
                Retour au Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 p-1 rounded-sm flex-wrap" style={{ background: '#E8E2D9' }}>
            <TabsTrigger value="dashboard" className="rounded-sm data-[state=active]:bg-white">
              <Activity className="w-4 h-4 mr-2" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-sm data-[state=active]:bg-white">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs ({users?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-sm data-[state=active]:bg-white">
              <Briefcase className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-sm data-[state=active]:bg-white">
              <FolderOpen className="w-4 h-4 mr-2" />
              Projets
            </TabsTrigger>
            <TabsTrigger value="kyc" className="rounded-sm data-[state=active]:bg-white relative">
              <FileText className="w-4 h-4 mr-2" />
              KYC
              {pendingKYCCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center" style={{ background: '#C75B39', color: '#FFFDFB' }}>
                  {pendingKYCCount}
                </span>
              )}
            </TabsTrigger>
            {isAdminOrSuper && (
              <TabsTrigger value="transactions" className="rounded-sm data-[state=active]:bg-white">
                <DollarSign className="w-4 h-4 mr-2" />
                Transactions
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="moderators" className="rounded-sm data-[state=active]:bg-white">
                <Shield className="w-4 h-4 mr-2" />
                Modérateurs
              </TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Total Utilisateurs', value: stats?.totalUsers || 0, icon: Users, color: '#C75B39', trend: '+12%' },
                  { label: 'Freelances actifs', value: stats?.totalFreelancers || 0, icon: Briefcase, color: '#5C6B4A', trend: '+8%' },
                  { label: 'Services publiés', value: stats?.totalServices || 0, icon: ShoppingCart, color: '#8B4513', trend: '+15%' },
                  { label: 'Projets ouverts', value: stats?.activeProjects || 0, icon: FolderOpen, color: '#C75B39', trend: '+5%' },
                ].map((stat, i) => (
                  <Card key={i} className="p-6" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-sm flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                        <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                      </div>
                      <Badge className="rounded-sm" style={{ background: 'rgba(92, 107, 74, 0.1)', color: '#5C6B4A' }}>
                        {stat.trend}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="text-sm" style={{ color: '#6B6560' }}>{stat.label}</p>
                  </Card>
                ))}
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-sm flex items-center justify-center" style={{ background: 'rgba(199, 91, 57, 0.1)' }}>
                      <FileText className="w-6 h-6" style={{ color: '#C75B39' }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                        {stats?.pendingKYC || 0}
                      </p>
                      <p className="text-sm" style={{ color: '#6B6560' }}>KYC en attente</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-sm flex items-center justify-center" style={{ background: 'rgba(220, 38, 38, 0.1)' }}>
                      <Gavel className="w-6 h-6" style={{ color: '#DC2626' }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                        {stats?.pendingDisputes || 0}
                      </p>
                      <p className="text-sm" style={{ color: '#6B6560' }}>Litiges ouverts</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-sm flex items-center justify-center" style={{ background: 'rgba(92, 107, 74, 0.1)' }}>
                      <DollarSign className="w-6 h-6" style={{ color: '#5C6B4A' }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                        {(stats?.totalRevenue || 0).toLocaleString()} FCFA
                      </p>
                      <p className="text-sm" style={{ color: '#6B6560' }}>Revenus totaux</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="p-6" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                  Actions rapides
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setActiveTab('kyc')} style={{ background: '#C75B39', color: '#FFFDFB' }}>
                    <FileText className="w-4 h-4 mr-2" />
                    Vérifier les KYC ({stats?.pendingKYC || 0})
                  </Button>
                  <Button onClick={() => setActiveTab('services')} variant="outline" style={{ borderColor: '#E8E2D9' }}>
                    <Briefcase className="w-4 h-4 mr-2" />
                    Modérer les services
                  </Button>
                  <Button onClick={() => setActiveTab('users')} variant="outline" style={{ borderColor: '#E8E2D9' }}>
                    <Users className="w-4 h-4 mr-2" />
                    Gérer les utilisateurs
                  </Button>
                  <Button onClick={() => { fetchStats(); fetchUsers(); toast.success("Données actualisées"); }} variant="outline" style={{ borderColor: '#E8E2D9' }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="p-6" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9A948D' }} />
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40" style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="user">Utilisateurs</SelectItem>
                    <SelectItem value="moderator">Modérateurs</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger className="w-40" style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="client">Clients</SelectItem>
                    <SelectItem value="freelance">Freelances</SelectItem>
                  </SelectContent>
                </Select>
                <Badge className="rounded-sm" style={{ background: '#E8E2D9', color: '#6B6560' }}>
                  {users?.length || 0} utilisateurs
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E8E2D9' }}>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Utilisateur</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Rôle</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>KYC</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Statut</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.map((u: any) => {
                      const roleBadge = getRoleBadge(u.role);
                      const kycBadge = getKYCStatusBadge(u.kyc_status);
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid #E8E2D9' }}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#E8E2D9' }}>
                                {u.avatar ? (
                                  <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <span className="font-semibold" style={{ color: '#6B6560' }}>
                                    {u.name?.charAt(0) || '?'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-medium block" style={{ color: '#1A1714' }}>{u.name || 'Sans nom'}</span>
                                <span className="text-xs" style={{ color: '#9A948D' }}>ID: {u.id.slice(0, 8)}...</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4" style={{ color: '#6B6560' }}>{u.email}</td>
                          <td className="py-3 px-4">
                            <Badge className="rounded-sm" style={{ background: '#E8E2D9', color: '#6B6560' }}>
                              {u.is_seller ? 'Freelance' : 'Client'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {isSuperAdmin && u.role !== 'superadmin' ? (
                              <Select
                                value={u.role || 'user'}
                                onValueChange={(newRole) => updateRole(u.id, newRole)}
                              >
                                <SelectTrigger className="w-32 h-8" style={{ background: roleBadge.bg, border: 'none', color: roleBadge.color }}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                                  <SelectItem value="user">Utilisateur</SelectItem>
                                  <SelectItem value="moderator">Modérateur</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className="rounded-sm" style={{ background: roleBadge.bg, color: roleBadge.color }}>
                                <roleBadge.icon className="w-3 h-3 mr-1" />
                                {roleBadge.label}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="rounded-sm" style={{ background: kycBadge.bg, color: kycBadge.color }}>
                              <kycBadge.icon className="w-3 h-3 mr-1" />
                              {kycBadge.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {u.is_banned ? (
                              <Badge className="rounded-sm" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>
                                <Ban className="w-3 h-3 mr-1" />
                                Banni
                              </Badge>
                            ) : (
                              <Badge className="rounded-sm" style={{ background: 'rgba(92, 107, 74, 0.1)', color: '#5C6B4A' }}>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Actif
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/${u.id}`}>
                                <Button size="sm" variant="outline" style={{ borderColor: '#E8E2D9' }}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              {u.role !== 'superadmin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleBanUser(u)}
                                  style={{ borderColor: u.is_banned ? '#5C6B4A' : '#DC2626', color: u.is_banned ? '#5C6B4A' : '#DC2626' }}
                                >
                                  {u.is_banned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card className="p-6" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                  Services à modérer
                </h3>
                <Button onClick={() => fetchServices()} variant="outline" size="sm" style={{ borderColor: '#E8E2D9' }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
              <div className="space-y-4">
                {services?.map((service: any) => (
                  <div key={service.id} className="flex items-center justify-between p-4 rounded-sm" style={{ background: '#FAF7F2', border: '1px solid #E8E2D9' }}>
                    <div className="flex-1">
                      <h4 className="font-medium" style={{ color: '#1A1714' }}>{service.title}</h4>
                      <p className="text-sm" style={{ color: '#6B6560' }}>
                        ID: {service.id} • {parseFloat(service.price).toLocaleString()} FCFA • Créé le {new Date(service.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-sm" style={{ 
                        background: service.status === 'active' ? 'rgba(92, 107, 74, 0.1)' : service.status === 'paused' ? 'rgba(199, 91, 57, 0.1)' : '#E8E2D9',
                        color: service.status === 'active' ? '#5C6B4A' : service.status === 'paused' ? '#C75B39' : '#6B6560'
                      }}>
                        {service.status === 'active' ? 'Actif' : service.status === 'paused' ? 'Pausé' : service.status}
                      </Badge>
                      <Link href={`/service/${service.id}`}>
                        <Button size="sm" variant="outline" style={{ borderColor: '#E8E2D9' }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => moderateService(service.id, 'approve')}
                        style={{ background: '#5C6B4A', color: '#FFFDFB' }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moderateService(service.id, 'pause')}
                        style={{ borderColor: '#C75B39', color: '#C75B39' }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!services || services.length === 0) && (
                  <p className="text-center py-8" style={{ color: '#6B6560' }}>Aucun service à modérer</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card className="p-6" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                  Projets publiés
                </h3>
                <Button onClick={() => fetchProjects()} variant="outline" size="sm" style={{ borderColor: '#E8E2D9' }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
              <div className="space-y-4">
                {projects?.map((project: any) => (
                  <div key={project.id} className="flex items-center justify-between p-4 rounded-sm" style={{ background: '#FAF7F2', border: '1px solid #E8E2D9' }}>
                    <div className="flex-1">
                      <h4 className="font-medium" style={{ color: '#1A1714' }}>{project.title}</h4>
                      <p className="text-sm" style={{ color: '#6B6560' }}>
                        Budget: {parseFloat(project.budget_min || 0).toLocaleString()} - {parseFloat(project.budget_max || 0).toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-sm" style={{ 
                        background: project.status === 'open' ? 'rgba(92, 107, 74, 0.1)' : 'rgba(199, 91, 57, 0.1)',
                        color: project.status === 'open' ? '#5C6B4A' : '#C75B39'
                      }}>
                        {project.status === 'open' ? 'Ouvert' : project.status}
                      </Badge>
                      <Link href={`/project/${project.id}`}>
                        <Button size="sm" variant="outline" style={{ borderColor: '#E8E2D9' }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {(!projects || projects.length === 0) && (
                  <p className="text-center py-8" style={{ color: '#6B6560' }}>Aucun projet</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <Card className="p-6" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                  Vérifications KYC
                </h3>
                <div className="flex items-center gap-4">
                  <Select value={kycFilter} onValueChange={setKycFilter}>
                    <SelectTrigger className="w-40" style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="verified">Approuvés</SelectItem>
                      <SelectItem value="rejected">Rejetés</SelectItem>
                      <SelectItem value="all">Tous</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => fetchKYC()} variant="outline" size="sm" style={{ borderColor: '#E8E2D9' }}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {kycDocuments?.map((doc: any) => {
                  const statusBadge = getKYCStatusBadge(doc.status);
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-sm" style={{ background: '#FAF7F2', border: '1px solid #E8E2D9' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-sm flex items-center justify-center" style={{ background: '#E8E2D9' }}>
                          <FileText className="w-6 h-6" style={{ color: '#6B6560' }} />
                        </div>
                        <div>
                          <h4 className="font-medium" style={{ color: '#1A1714' }}>{doc.user?.name || 'Utilisateur'}</h4>
                          <p className="text-sm" style={{ color: '#6B6560' }}>
                            {doc.documentType}
                          </p>
                          <p className="text-xs" style={{ color: '#9A948D' }}>
                            Soumis le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="rounded-sm" style={{ background: statusBadge.bg, color: statusBadge.color }}>
                          <statusBadge.icon className="w-3 h-3 mr-1" />
                          {statusBadge.label}
                        </Badge>
                        {doc.documentUrl && (
                          <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" style={{ borderColor: '#E8E2D9' }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {doc.status === 'pending' && isAdminOrSuper && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleKYCDecision(doc.user.id, 'approved')}
                              style={{ background: '#5C6B4A', color: '#FFFDFB' }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleKYCDecision(doc.user.id, 'rejected')}
                              style={{ borderColor: '#DC2626', color: '#DC2626' }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!kycDocuments || kycDocuments.length === 0) && (
                  <p className="text-center py-8" style={{ color: '#6B6560' }}>Aucun document KYC</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          {isAdminOrSuper && (
            <TabsContent value="transactions">
              <Card className="p-6" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                    Transactions récentes
                  </h3>
                  <Button onClick={() => fetchTransactions()} variant="outline" size="sm" style={{ borderColor: '#E8E2D9' }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E8E2D9' }}>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Référence</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Montant</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Statut</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#6B6560' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions?.map((tx: any) => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid #E8E2D9' }}>
                          <td className="py-3 px-4 font-mono text-sm" style={{ color: '#1A1714' }}>{tx.id}</td>
                          <td className="py-3 px-4">
                            <Badge className="rounded-sm" style={{ 
                              background: tx.type === 'deposit' || tx.type === 'earning' ? 'rgba(92, 107, 74, 0.1)' : 'rgba(199, 91, 57, 0.1)',
                              color: tx.type === 'deposit' || tx.type === 'earning' ? '#5C6B4A' : '#C75B39'
                            }}>
                              {tx.type === 'deposit' ? 'Dépôt' : tx.type === 'withdrawal' ? 'Retrait' : tx.type === 'earning' ? 'Gain' : tx.type === 'payment' ? 'Paiement' : tx.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold" style={{ color: '#1A1714' }}>
                            {parseFloat(tx.amount).toLocaleString()} FCFA
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="rounded-sm" style={{ 
                              background: tx.status === 'completed' ? 'rgba(92, 107, 74, 0.1)' : tx.status === 'pending' ? 'rgba(199, 91, 57, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                              color: tx.status === 'completed' ? '#5C6B4A' : tx.status === 'pending' ? '#C75B39' : '#DC2626'
                            }}>
                              {tx.status === 'completed' ? 'Complété' : tx.status === 'pending' ? 'En attente' : tx.status === 'failed' ? 'Échoué' : tx.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#6B6560' }}>
                            {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-3 px-4">
                            {tx.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => processTransaction(tx.id, 'approve')}
                                  style={{ background: '#5C6B4A', color: '#FFFDFB' }}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => processTransaction(tx.id, 'reject')}
                                  style={{ borderColor: '#DC2626', color: '#DC2626' }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          )}

          {/* Moderators Tab (SuperAdmin only) */}
          {isSuperAdmin && (
            <TabsContent value="moderators">
              <Card className="p-6" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                    Équipe de modération
                  </h3>
                  <Button onClick={() => setActiveTab('users')} variant="outline" style={{ borderColor: '#E8E2D9' }}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Ajouter un modérateur
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moderators?.map((mod: any) => {
                    const badge = getRoleBadge(mod.role);
                    return (
                      <Card key={mod.id} className="p-4" style={{ background: '#FAF7F2', border: '1px solid #E8E2D9' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#E8E2D9' }}>
                            {mod.avatar ? (
                              <img src={mod.avatar} alt={mod.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <span className="text-lg font-semibold" style={{ color: '#6B6560' }}>
                                {mod.name?.charAt(0) || '?'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium" style={{ color: '#1A1714' }}>{mod.name}</h4>
                            <p className="text-sm" style={{ color: '#6B6560' }}>{mod.email}</p>
                            <Badge className="mt-1 rounded-sm" style={{ background: badge.bg, color: badge.color }}>
                              <badge.icon className="w-3 h-3 mr-1" />
                              {badge.label}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {(!moderators || moderators.length === 0) && (
                  <p className="text-center py-8" style={{ color: '#6B6560' }}>Aucun modérateur</p>
                )}
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
              {selectedUser?.is_banned ? 'Débannir l\'utilisateur' : 'Bannir l\'utilisateur'}
            </DialogTitle>
            <DialogDescription style={{ color: '#6B6560' }}>
              {selectedUser?.is_banned 
                ? `Voulez-vous débannir ${selectedUser?.name} ?`
                : `Voulez-vous bannir ${selectedUser?.name} ? Cette action peut être annulée.`
              }
            </DialogDescription>
          </DialogHeader>
          {!selectedUser?.is_banned && (
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block" style={{ color: '#3D3833' }}>
                Raison du bannissement (optionnel)
              </label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Entrez la raison du bannissement..."
                style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)} style={{ borderColor: '#E8E2D9' }}>
              Annuler
            </Button>
            <Button 
              onClick={confirmBan}
              style={{ 
                background: selectedUser?.is_banned ? '#5C6B4A' : '#DC2626', 
                color: '#FFFDFB' 
              }}
            >
              {selectedUser?.is_banned ? 'Débannir' : 'Bannir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}