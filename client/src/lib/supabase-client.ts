import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
} else {
  throw new Error('Supabase URL and Anon Key are required');
}

export { supabase };

// ==================== TYPES ====================

export interface User {
  id: number;
  auth_id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
  user_type: 'client' | 'freelance';
  avatar?: string;
  bio?: string;
  is_seller: boolean;
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  status: 'draft' | 'active' | 'paused' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  service_id: number;
  buyer_id: number;
  seller_id: number;
  title: string;
  price: number;
  currency: string;
  status: 'pending' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  payment_status: 'pending' | 'paid' | 'refunded' | 'released';
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  pending_balance: number;
  currency: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  wallet_id: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'refund' | 'fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
}

// ==================== USER FUNCTIONS ====================

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data as User;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

export async function updateUserProfile(userId: number, updates: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data as User;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
}

// ==================== SERVICE FUNCTIONS ====================

export async function getServices(filters?: {
  categoryId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Service[]> {
  try {
    let query = supabase
      .from('services')
      .select('*')
      .eq('status', 'active');

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return [];
    }

    return (data || []) as Service[];
  } catch (error) {
    console.error('Error in getServices:', error);
    return [];
  }
}

export async function getServiceById(serviceId: number): Promise<Service | null> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error) {
      console.error('Error fetching service:', error);
      return null;
    }

    return data as Service;
  } catch (error) {
    console.error('Error in getServiceById:', error);
    return null;
  }
}

export async function createService(userId: number, serviceData: Partial<Service>): Promise<Service | null> {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert({
        user_id: userId,
        ...serviceData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return null;
    }

    return data as Service;
  } catch (error) {
    console.error('Error in createService:', error);
    return null;
  }
}

// ==================== ORDER FUNCTIONS ====================

export async function getOrders(userId: number, role: 'buyer' | 'seller'): Promise<Order[]> {
  try {
    let query = supabase.from('orders').select('*');

    if (role === 'buyer') {
      query = query.eq('buyer_id', userId);
    } else {
      query = query.eq('seller_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return (data || []) as Order[];
  } catch (error) {
    console.error('Error in getOrders:', error);
    return [];
  }
}

export async function getOrderById(orderId: number): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return data as Order;
  } catch (error) {
    console.error('Error in getOrderById:', error);
    return null;
  }
}

// ==================== WALLET FUNCTIONS ====================

export async function getWallet(userId: number): Promise<Wallet | null> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }

    return data as Wallet;
  } catch (error) {
    console.error('Error in getWallet:', error);
    return null;
  }
}

export async function getTransactions(userId: number, limit = 50): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return (data || []) as Transaction[];
  } catch (error) {
    console.error('Error in getTransactions:', error);
    return [];
  }
}

// ==================== ESCROW FUNCTIONS ====================

export async function initializeEscrow(params: {
  orderId: number;
  buyerId: number;
  sellerId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentReference?: string;
}): Promise<{ success: boolean; escrow_id?: string; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/escrow`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in initializeEscrow:', error);
    return { success: false, error: 'Failed to initialize escrow' };
  }
}

export async function releaseEscrow(orderId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/release_escrow`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in releaseEscrow:', error);
    return { success: false, error: 'Failed to release escrow' };
  }
}

export async function refundEscrow(orderId: number, reason: string, partialAmount?: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refund_escrow`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId, reason, partialAmount }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in refundEscrow:', error);
    return { success: false, error: 'Failed to refund escrow' };
  }
}

// ==================== REALTIME SUBSCRIPTIONS ====================

export function subscribeToMessages(conversationId: number, callback: (message: any) => void) {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}

export function subscribeToOrderUpdates(orderId: number, callback: (order: any) => void) {
  return supabase
    .channel(`order:${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}

export function subscribeToWalletUpdates(userId: number, callback: (wallet: any) => void) {
  return supabase
    .channel(`wallet:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}
