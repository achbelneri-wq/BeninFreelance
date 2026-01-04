/**
 * BeninFreelance - Service API centralisé
 * 
 * Ce fichier contient toutes les fonctions d'appel à l'API Supabase.
 * Il sert de couche d'abstraction entre les composants et la base de données.
 */

import { supabase } from './supabase';

// =====================================================
// TYPES
// =====================================================

export interface User {
  id: number;
  auth_id: string;
  email: string;
  name: string;
  bio?: string;
  phone?: string;
  city?: string;
  country?: string;
  avatar?: string;
  skills?: string[];
  languages?: string[];
  is_seller: boolean;
  user_type: 'client' | 'freelance' | 'both';
  rating: string;
  total_reviews: number;
  completed_orders: number;
  kyc_status: 'pending' | 'submitted' | 'verified' | 'rejected';
  created_at: string;
}

export interface Service {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  price: string;
  delivery_time: number;
  images: string[];
  rating: string;
  total_reviews: number;
  status: 'draft' | 'active' | 'paused' | 'deleted';
  user?: User;
}

export interface Project {
  id: number;
  client_id: number;
  title: string;
  description: string;
  category: string;
  budget_min?: string;
  budget_max?: string;
  deadline?: string;
  skills_required?: string[];
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  proposals_count: number;
  client?: User;
}

export interface Order {
  id: number;
  service_id?: number;
  project_id?: number;
  buyer_id: number;
  seller_id: number;
  title: string;
  price: string;
  status: 'pending' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  created_at: string;
  service?: Service;
  buyer?: User;
  seller?: User;
}

export interface Transaction {
  id: number;
  user_id: number;
  order_id?: number;
  type: 'deposit' | 'withdrawal' | 'earning' | 'payment' | 'refund' | 'fee';
  amount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description?: string;
  created_at: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  balance: string;
  pending_balance: string;
  total_earned: string;
  total_withdrawn: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

// =====================================================
// SERVICES API
// =====================================================

export const servicesApi = {
  /**
   * Récupérer tous les services actifs
   */
  async getAll(options?: {
    category?: string;
    search?: string;
    sortBy?: 'recent' | 'popular' | 'rating' | 'price_asc' | 'price_desc';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Service[]>> {
    try {
      let query = supabase
        .from('services')
        .select(`
          *,
          user:users!services_user_id_fkey (
            id, name, avatar, rating, kyc_status
          )
        `, { count: 'exact' })
        .eq('status', 'active');

      if (options?.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      switch (options?.sortBy) {
        case 'popular':
          query = query.order('total_reviews', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { data, error: null, count: count || 0 };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Récupérer un service par ID
   */
  async getById(id: number): Promise<ApiResponse<Service>> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          user:users!services_user_id_fkey (
            id, name, avatar, bio, rating, total_reviews, completed_orders, kyc_status, created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Récupérer les services d'un utilisateur
   */
  async getByUser(userId: number): Promise<ApiResponse<Service[]>> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Créer un nouveau service
   */
  async create(service: Partial<Service>): Promise<ApiResponse<Service>> {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Mettre à jour un service
   */
  async update(id: number, updates: Partial<Service>): Promise<ApiResponse<Service>> {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Supprimer un service (soft delete)
   */
  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: 'deleted' })
        .eq('id', id);

      if (error) throw error;
      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
};

// =====================================================
// PROJECTS API
// =====================================================

export const projectsApi = {
  /**
   * Récupérer tous les projets ouverts
   */
  async getAll(options?: {
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<ApiResponse<Project[]>> {
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          client:users!projects_client_id_fkey (
            id, name, avatar, kyc_status
          )
        `, { count: 'exact' })
        .eq('status', 'open')
        .eq('visibility', 'public');

      if (options?.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      query = query.order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { data, error: null, count: count || 0 };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Récupérer un projet par ID
   */
  async getById(id: number): Promise<ApiResponse<Project>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:users!projects_client_id_fkey (
            id, name, avatar, rating, kyc_status
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Récupérer les projets d'un client
   */
  async getByClient(clientId: number): Promise<ApiResponse<Project[]>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Créer un nouveau projet
   */
  async create(project: Partial<Project>): Promise<ApiResponse<Project>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
};

// =====================================================
// ORDERS API
// =====================================================

export const ordersApi = {
  /**
   * Récupérer les commandes d'un acheteur
   */
  async getBuyerOrders(buyerId: number): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          service:services!orders_service_id_fkey (id, title, images),
          seller:users!orders_seller_id_fkey (id, name, avatar)
        `)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Récupérer les commandes d'un vendeur
   */
  async getSellerOrders(sellerId: number): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          service:services!orders_service_id_fkey (id, title, images),
          buyer:users!orders_buyer_id_fkey (id, name, avatar)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateStatus(orderId: number, status: Order['status']): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Créer une nouvelle commande
   */
  async create(order: Partial<Order>): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
};

// =====================================================
// WALLET API
// =====================================================

export const walletApi = {
  /**
   * Récupérer le portefeuille d'un utilisateur
   */
  async getByUser(userId: number): Promise<ApiResponse<Wallet>> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Récupérer les transactions d'un utilisateur
   */
  async getTransactions(userId: number, limit = 10): Promise<ApiResponse<Transaction[]>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
};

// =====================================================
// USERS API
// =====================================================

export const usersApi = {
  /**
   * Récupérer un utilisateur par ID
   */
  async getById(id: number): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Récupérer un utilisateur par auth_id
   */
  async getByAuthId(authId: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Mettre à jour un profil utilisateur
   */
  async update(id: number, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Récupérer les meilleurs freelances
   */
  async getTopFreelancers(limit = 6): Promise<ApiResponse<User[]>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_seller', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
};

// =====================================================
// STATS API
// =====================================================

export const statsApi = {
  /**
   * Récupérer les statistiques globales
   */
  async getGlobalStats(): Promise<ApiResponse<{
    totalFreelancers: number;
    totalServices: number;
    totalProjects: number;
    completedOrders: number;
  }>> {
    try {
      const [freelancers, services, projects, orders] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_seller', true),
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed')
      ]);

      return {
        data: {
          totalFreelancers: freelancers.count || 0,
          totalServices: services.count || 0,
          totalProjects: projects.count || 0,
          completedOrders: orders.count || 0
        },
        error: null
      };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Récupérer les statistiques d'un utilisateur
   */
  async getUserStats(userId: number, isSeller: boolean): Promise<ApiResponse<{
    activeServices?: number;
    totalOrders: number;
    pendingOrders: number;
    totalEarnings?: number;
    totalSpent?: number;
  }>> {
    try {
      if (isSeller) {
        const [services, orders, wallet] = await Promise.all([
          supabase.from('services').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', userId),
          supabase.from('wallets').select('total_earned').eq('user_id', userId).single()
        ]);

        const pendingOrders = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', userId)
          .in('status', ['pending', 'in_progress']);

        return {
          data: {
            activeServices: services.count || 0,
            totalOrders: orders.count || 0,
            pendingOrders: pendingOrders.count || 0,
            totalEarnings: parseFloat(wallet.data?.total_earned || '0')
          },
          error: null
        };
      } else {
        const [orders, wallet] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('buyer_id', userId),
          supabase.from('wallets').select('balance').eq('user_id', userId).single()
        ]);

        const pendingOrders = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('buyer_id', userId)
          .in('status', ['pending', 'in_progress', 'delivered']);

        return {
          data: {
            totalOrders: orders.count || 0,
            pendingOrders: pendingOrders.count || 0,
            totalSpent: parseFloat(wallet.data?.balance || '0')
          },
          error: null
        };
      }
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
};

// =====================================================
// ESCROW API
// =====================================================

export const escrowApi = {
  /**
   * Récupérer l'escrow d'une commande
   */
  async getByOrderId(orderId: number): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('escrow')
        .select(`
          *,
          order:orders!escrow_order_id_fkey (
            id, title, status, buyer_id, seller_id,
            buyer:users!orders_buyer_id_fkey (id, name),
            seller:users!orders_seller_id_fkey (id, name)
          )
        `)
        .eq('order_id', orderId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Libérer les fonds de l'escrow
   */
  async release(orderId: number): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.rpc('release_escrow', { order_id: orderId });
      if (error) throw error;
      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  /**
   * Rembourser l'escrow
   */
  async refund(orderId: number): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.rpc('refund_escrow', { order_id: orderId });
      if (error) throw error;
      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
};

// Export par défaut
export default {
  services: servicesApi,
  projects: projectsApi,
  orders: ordersApi,
  wallet: walletApi,
  users: usersApi,
  stats: statsApi,
  escrow: escrowApi
};
