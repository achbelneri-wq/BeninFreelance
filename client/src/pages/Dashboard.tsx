import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Store,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  FolderKanban,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// Types TypeScript
interface Stats {
  activeServices: number;
  activeOrders: number;
  completedOrders: number;
  totalEarnings: number;
  totalProjects: number;
  totalSpent: number;
  balance: number;
  pendingBalance: number;
}

interface Order {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  price: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'deposit' | 'payment';
  amount: string;
  createdAt: string;
}

interface Activity {
  orders: Order[];
  transactions: Transaction[];
}

export default function Dashboard() {
  // ✅ CORRECTION: Ajouter profile
  const { user, profile } = useAuth();
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("Utilisateur");
  const [stats, setStats] = useState<Stats>({
    activeServices: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    totalProjects: 0,
    totalSpent: 0,
    balance: 0,
    pendingBalance: 0
  });
  const [activity, setActivity] = useState<Activity>({
    orders: [],
    transactions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Chargement du nom utilisateur
  useEffect(() => {
    async function loadUserName() {
      if (!user?.id) return;

      try {
        // ✅ CORRECTION: Retirer full_name
        const sessionName = user.user_metadata?.name || user.name || profile?.name;

        if (sessionName && sessionName !== "Utilisateur") {
          setFirstName(sessionName.split(' ')[0]);
        } else {
          // 2. Récupérer depuis la base de données
          // ✅ CORRECTION: Retirer full_name + utiliser auth_id
          const { data, error } = await supabase
            .from('users')
            .select('name')
            .eq('auth_id', user.id)
            .single();

          if (error) {
            console.error('Erreur lors du chargement du nom:', error);
            return;
          }

          if (data) {
            // ✅ CORRECTION: Retirer data.full_name
            const dbName = data.name || "Utilisateur";
            setFirstName(dbName.split(' ')[0]);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      }
    }

    loadUserName();
  }, [user, profile]);

  // Chargement des statistiques et activités
  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // ✅ CORRECTION: Utiliser profile.is_seller
        if (profile?.is_seller || user.is_seller) {
          await loadSellerStats();
        } else {
          await loadBuyerStats();
        }

        // Charger les commandes récentes
        await loadRecentOrders();

        // Charger les transactions récentes
        await loadRecentTransactions();

      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [user, profile]);

  // Chargement des stats vendeur
  async function loadSellerStats() {
    if (!user?.id) return;

    try {
      // Services actifs
      const { count: activeServices } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Commandes en cours
      const { count: activeOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .in('status', ['pending', 'in_progress']);

      // Commandes terminées
      const { count: completedOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('status', 'completed');

      // Revenus totaux
      const { data: earningsData } = await supabase
        .from('orders')
        .select('price')
        .eq('seller_id', user.id)
        .eq('status', 'completed');

      const totalEarnings = earningsData?.reduce((sum, order) => 
        sum + parseFloat(order.price || '0'), 0) || 0;

      // Solde disponible
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance, pending_balance')
        .eq('user_id', user.id)
        .single();

      setStats(prev => ({
        ...prev,
        activeServices: activeServices || 0,
        activeOrders: activeOrders || 0,
        completedOrders: completedOrders || 0,
        totalEarnings,
        balance: parseFloat(walletData?.balance || '0'),
        pendingBalance: parseFloat(walletData?.pending_balance || '0')
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des stats vendeur:', error);
    }
  }

  // Chargement des stats acheteur
  async function loadBuyerStats() {
    if (!user?.id) return;

    try {
      // Projets publiés
      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Commandes actives
      const { count: activeOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .in('status', ['pending', 'in_progress']);

      // Commandes terminées
      const { count: completedOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .eq('status', 'completed');

      // Total dépensé
      const { data: spentData } = await supabase
        .from('orders')
        .select('price')
        .eq('buyer_id', user.id)
        .eq('status', 'completed');

      const totalSpent = spentData?.reduce((sum, order) => 
        sum + parseFloat(order.price || '0'), 0) || 0;

      // Solde disponible
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      setStats(prev => ({
        ...prev,
        totalProjects: totalProjects || 0,
        activeOrders: activeOrders || 0,
        completedOrders: completedOrders || 0,
        totalSpent,
        balance: parseFloat(walletData?.balance || '0')
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des stats acheteur:', error);
    }
  }

  // Chargement des commandes récentes
  async function loadRecentOrders() {
    if (!user?.id) return;

    try {
      // ✅ CORRECTION: Utiliser profile.is_seller
      const query = (profile?.is_seller || user.is_seller)
        ? supabase
            .from('orders')
            .select('id, title, status, price, created_at')
            .eq('seller_id', user.id)
        : supabase
            .from('orders')
            .select('id, title, status, price, created_at')
            .eq('buyer_id', user.id);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const orders: Order[] = (data || []).map(order => ({
        id: order.id,
        title: order.title,
        status: order.status,
        price: order.price,
        createdAt: order.created_at
      }));

      setActivity(prev => ({ ...prev, orders }));
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    }
  }

  // Chargement des transactions récentes
  async function loadRecentTransactions() {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, type, amount, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const transactions: Transaction[] = (data || []).map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        createdAt: tx.created_at
      }));

      setActivity(prev => ({ ...prev, transactions }));
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    }
  }

  // Helper pour formatter les prix
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' F';
  };

  // ✅ CORRECTION: Utiliser profile.is_seller
  const sellerStats = (profile?.is_seller || user?.is_seller) ? [
    {
      title: 'Services actifs',
      value: stats.activeServices,
      icon: Store,
      color: '#C75B39',
      bgColor: 'rgba(199, 91, 57, 0.1)',
      href: '/dashboard/services'
    },
    {
      title: 'Commandes actives',
      value: stats.activeOrders,
      icon: ShoppingBag,
      color: '#5C6B4A',
      bgColor: 'rgba(92, 107, 74, 0.1)',
      href: '/dashboard/orders'
    },
    {
      title: 'Commandes terminées',
      value: stats.completedOrders,
      icon: CheckCircle2,
      color: '#8B4513',
      bgColor: 'rgba(139, 69, 19, 0.1)',
      href: '/dashboard/orders'
    },
    {
      title: 'Revenus totaux',
      value: formatCurrency(stats.totalEarnings),
      icon: TrendingUp,
      color: '#1A1714',
      bgColor: 'rgba(26, 23, 20, 0.05)',
      href: '/dashboard/wallet'
    },
  ] : [
    {
      title: 'Projets publiés',
      value: stats.totalProjects,
      icon: FolderKanban,
      color: '#C75B39',
      bgColor: 'rgba(199, 91, 57, 0.1)',
      href: '/dashboard/projects'
    },
    {
      title: 'Commandes actives',
      value: stats.activeOrders,
      icon: ShoppingBag,
      color: '#5C6B4A',
      bgColor: 'rgba(92, 107, 74, 0.1)',
      href: '/dashboard/orders'
    },
    {
      title: 'Commandes terminées',
      value: stats.completedOrders,
      icon: CheckCircle2,
      color: '#8B4513',
      bgColor: 'rgba(139, 69, 19, 0.1)',
      href: '/dashboard/orders'
    },
    {
      title: 'Total dépensé',
      value: formatCurrency(stats.totalSpent),
      icon: Wallet,
      color: '#1A1714',
      bgColor: 'rgba(26, 23, 20, 0.05)',
      href: '/dashboard/wallet'
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-sm border-4 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: '#C75B39', borderTopColor: 'transparent' }} />
          <p style={{ color: '#6B6560' }}>Chargement de votre dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
            Bienvenue, {firstName} 👋
          </h1>
          <p className="mt-1" style={{ color: '#6B6560' }}>
            Voici un aperçu de votre activité
          </p>
        </div>

        {/* Boutons d'action */}
        {/* ✅ CORRECTION: Utiliser profile.is_seller */}
        {(profile?.is_seller || user?.is_seller) ? (
          <Link href="/dashboard/services/new">
            <Button className="rounded-sm min-h-[48px]" style={{ background: '#C75B39', color: '#FFFDFB' }}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un service
            </Button>
          </Link>
        ) : (
          <Link href="/dashboard/projects">
            <Button 
              className="rounded-sm min-h-[48px]" 
              style={{ background: '#C75B39', color: '#FFFDFB' }}
              onClick={(e) => {
                // ✅ CORRECTION: Utiliser setLocation au lieu de window.location
                e.preventDefault();
                setLocation('/dashboard/projects');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Publier un projet
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sellerStats.map((stat, idx) => (
          <Link key={idx} href={stat.href}>
            <div className="group relative p-6 rounded-sm transition-all cursor-pointer overflow-hidden hover:shadow-md" style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: '#6B6560' }}>{stat.title}</p>
                  <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                    {stat.value}
                  </p>
                </div>
                <div className="p-3 rounded-sm" style={{ background: stat.bgColor }}>
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Wallet Card */}
      <div className="relative p-6 rounded-sm overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A1714 0%, #3D3833 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" style={{ background: '#C75B39' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" style={{ background: '#5C6B4A' }} />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm flex items-center gap-2" style={{ color: 'rgba(250, 247, 242, 0.8)' }}>
              <Wallet className="h-4 w-4" />
              Solde disponible
            </p>
            <p className="text-4xl font-bold mt-2" style={{ fontFamily: 'Playfair Display, serif', color: '#FAF7F2' }}>
              {formatCurrency(stats.balance)}
            </p>
            {/* ✅ CORRECTION: Utiliser profile.is_seller */}
            {(profile?.is_seller || user?.is_seller) && stats.pendingBalance > 0 && (
              <p className="text-sm mt-2 flex items-center gap-1" style={{ color: 'rgba(250, 247, 242, 0.6)' }}>
                <Clock className="h-3 w-3" />
                + {formatCurrency(stats.pendingBalance)} en attente
              </p>
            )}
          </div>
          <Link href="/dashboard/wallet">
            <Button variant="secondary" className="rounded-sm backdrop-blur-sm min-h-[48px]" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#FAF7F2', border: 'none' }}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Voir le portefeuille
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="p-6 rounded-sm" style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
              Commandes récentes
            </h2>
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm" className="gap-1 min-h-[44px]" style={{ color: '#6B6560' }}>
                Voir tout <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {activity.orders.length > 0 ? (
            <div className="space-y-4">
              {activity.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-sm transition-colors hover:bg-opacity-80" style={{ background: '#FAF7F2' }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-sm" style={{ 
                      background: order.status === 'completed' ? 'rgba(92, 107, 74, 0.1)' :
                        order.status === 'in_progress' ? 'rgba(199, 91, 57, 0.1)' :
                        'rgba(139, 69, 19, 0.1)'
                    }}>
                      {order.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" style={{ color: '#5C6B4A' }} />
                      ) : order.status === 'in_progress' ? (
                        <Clock className="h-4 w-4" style={{ color: '#C75B39' }} />
                      ) : (
                        <AlertCircle className="h-4 w-4" style={{ color: '#8B4513' }} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[200px]" style={{ color: '#1A1714' }}>
                        {order.title}
                      </p>
                      <p className="text-xs" style={{ color: '#9A948D' }}>
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-sm" style={{ color: '#1A1714' }}>
                    {parseFloat(order.price).toLocaleString('fr-FR')} F
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-4" style={{ background: '#E8E2D9' }}>
                <ShoppingBag className="h-8 w-8" style={{ color: '#9A948D' }} />
              </div>
              <p style={{ color: '#6B6560' }}>Aucune commande récente</p>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="p-6 rounded-sm" style={{ background: '#FFFDFB', border: '1px solid #E8E2D9' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
              Transactions récentes
            </h2>
            <Link href="/dashboard/wallet">
              <Button variant="ghost" size="sm" className="gap-1 min-h-[44px]" style={{ color: '#6B6560' }}>
                Voir tout <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {activity.transactions.length > 0 ? (
            <div className="space-y-4">
              {activity.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-sm transition-colors hover:bg-opacity-80" style={{ background: '#FAF7F2' }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-sm" style={{ 
                      background: tx.type === 'earning' ? 'rgba(92, 107, 74, 0.1)' :
                        tx.type === 'withdrawal' ? 'rgba(199, 91, 57, 0.1)' :
                        'rgba(139, 69, 19, 0.1)'
                    }}>
                      {tx.type === 'earning' ? (
                        <ArrowUpRight className="h-4 w-4" style={{ color: '#5C6B4A' }} />
                      ) : tx.type === 'withdrawal' ? (
                        <ArrowDownRight className="h-4 w-4" style={{ color: '#C75B39' }} />
                      ) : (
                        <ShoppingBag className="h-4 w-4" style={{ color: '#8B4513' }} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#1A1714' }}>
                        {tx.type === 'earning' ? 'Revenu' :
                         tx.type === 'withdrawal' ? 'Retrait' :
                         tx.type === 'deposit' ? 'Dépôt' : 'Paiement'}
                      </p>
                      <p className="text-xs" style={{ color: '#9A948D' }}>
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-sm" style={{ 
                    color: tx.type === 'earning' || tx.type === 'deposit' ? '#5C6B4A' : '#C75B39'
                  }}>
                    {tx.type === 'earning' || tx.type === 'deposit' ? '+' : '-'}
                    {parseFloat(tx.amount).toLocaleString('fr-FR')} F
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-4" style={{ background: '#E8E2D9' }}>
                <Wallet className="h-8 w-8" style={{ color: '#9A948D' }} />
              </div>
              <p style={{ color: '#6B6560' }}>Aucune transaction récente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}