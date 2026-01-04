/**
 * Supabase Realtime pour la messagerie en temps réel
 * ===================================================
 * Remplace Socket.IO pour une meilleure intégration avec Supabase
 */

import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type MessageCallback = (message: any) => void;
type TypingCallback = (data: { userId: number; isTyping: boolean; userName?: string }) => void;
type OnlineCallback = (data: { userId: number }) => void;

class SupabaseRealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private messageCallbacks: MessageCallback[] = [];
  private typingCallbacks: TypingCallback[] = [];
  private onlineCallbacks: OnlineCallback[] = [];
  private offlineCallbacks: OnlineCallback[] = [];
  private presenceChannel: RealtimeChannel | null = null;
  private userId: number | null = null;
  private userName: string | null = null;

  /**
   * Initialise le service avec l'utilisateur connecté
   */
  initialize(userId: number, userName?: string) {
    this.userId = userId;
    this.userName = userName || null;
    this.setupPresence();
  }

  /**
   * Configure le canal de présence pour le statut en ligne
   */
  private setupPresence() {
    if (!this.userId) return;

    this.presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: String(this.userId),
        },
      },
    });

    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = this.presenceChannel?.presenceState() || {};
        console.log('[Supabase Realtime] Presence sync:', Object.keys(state));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        const userId = parseInt(key);
        if (!isNaN(userId)) {
          this.onlineCallbacks.forEach(cb => cb({ userId }));
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        const userId = parseInt(key);
        if (!isNaN(userId)) {
          this.offlineCallbacks.forEach(cb => cb({ userId }));
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.presenceChannel?.track({
            online_at: new Date().toISOString(),
            user_id: this.userId,
          });
        }
      });
  }

  /**
   * Rejoint une conversation pour recevoir les messages en temps réel
   */
  joinConversation(conversationId: number): () => void {
    const channelName = `conversation:${conversationId}`;
    
    if (this.channels.has(channelName)) {
      return () => this.leaveConversation(conversationId);
    }

    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        this.messageCallbacks.forEach(cb => cb(payload));
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== this.userId) {
          this.typingCallbacks.forEach(cb => cb(payload));
        }
      })
      .on('broadcast', { event: 'messages_read' }, ({ payload }) => {
        // Gérer le statut de lecture des messages
        console.log('[Supabase Realtime] Messages read:', payload);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    console.log(`[Supabase Realtime] Joined conversation ${conversationId}`);

    return () => this.leaveConversation(conversationId);
  }

  /**
   * Quitte une conversation
   */
  leaveConversation(conversationId: number) {
    const channelName = `conversation:${conversationId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`[Supabase Realtime] Left conversation ${conversationId}`);
    }
  }

  /**
   * Envoie un message via broadcast (le message est aussi sauvegardé via l'API)
   */
  async sendMessage(conversationId: number, message: any) {
    const channelName = `conversation:${conversationId}`;
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      // Créer le canal s'il n'existe pas
      channel = supabase.channel(channelName);
      await channel.subscribe();
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: {
        ...message,
        conversationId,
        senderId: this.userId,
        createdAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Indique que l'utilisateur est en train de taper
   */
  async startTyping(conversationId: number) {
    const channelName = `conversation:${conversationId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: this.userId,
          userName: this.userName,
          isTyping: true,
        },
      });
    }
  }

  /**
   * Indique que l'utilisateur a arrêté de taper
   */
  async stopTyping(conversationId: number) {
    const channelName = `conversation:${conversationId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: this.userId,
          userName: this.userName,
          isTyping: false,
        },
      });
    }
  }

  /**
   * Marque les messages comme lus
   */
  async markAsRead(conversationId: number) {
    const channelName = `conversation:${conversationId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'messages_read',
        payload: {
          conversationId,
          readBy: this.userId,
          readAt: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * S'abonne aux nouveaux messages
   */
  onNewMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * S'abonne aux indicateurs de frappe
   */
  onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * S'abonne aux événements de connexion
   */
  onUserOnline(callback: OnlineCallback): () => void {
    this.onlineCallbacks.push(callback);
    return () => {
      this.onlineCallbacks = this.onlineCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * S'abonne aux événements de déconnexion
   */
  onUserOffline(callback: OnlineCallback): () => void {
    this.offlineCallbacks.push(callback);
    return () => {
      this.offlineCallbacks = this.offlineCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Vérifie si un utilisateur est en ligne
   */
  isUserOnline(userId: number): boolean {
    if (!this.presenceChannel) return false;
    const state = this.presenceChannel.presenceState();
    return String(userId) in state;
  }

  /**
   * Obtient la liste des utilisateurs en ligne
   */
  getOnlineUsers(): number[] {
    if (!this.presenceChannel) return [];
    const state = this.presenceChannel.presenceState();
    return Object.keys(state).map(k => parseInt(k)).filter(n => !isNaN(n));
  }

  /**
   * Déconnecte tous les canaux
   */
  disconnect() {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();

    if (this.presenceChannel) {
      supabase.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }

    this.messageCallbacks = [];
    this.typingCallbacks = [];
    this.onlineCallbacks = [];
    this.offlineCallbacks = [];
    this.userId = null;
    this.userName = null;

    console.log('[Supabase Realtime] Disconnected');
  }
}

export const supabaseRealtime = new SupabaseRealtimeService();
