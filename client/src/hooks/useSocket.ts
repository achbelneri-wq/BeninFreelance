/**
 * Hook useSocket - Messagerie en temps réel
 * =========================================
 * Utilise Supabase Realtime avec fallback vers Socket.IO
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { supabaseRealtime } from "@/lib/supabaseRealtime";
import { supabase } from "@/lib/supabase";

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  attachments?: string;
  createdAt: string;
  tempId?: string;
}

interface TypingUser {
  userId: number;
  userName?: string;
  isTyping: boolean;
}

interface MessageNotification {
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  preview: string;
  timestamp: string;
}

// Vérifier si Supabase est configuré
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key);
};

export function useSocket() {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<number, TypingUser>>(new Map());
  const typingTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const useSupabase = isSupabaseConfigured();

  // Initialize connection (Supabase Realtime ou Socket.IO)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // Déconnexion
      if (useSupabase) {
        supabaseRealtime.disconnect();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    if (useSupabase) {
      // Utiliser Supabase Realtime
      console.log("[Realtime] Using Supabase Realtime");
      supabaseRealtime.initialize(user.id, user.name || undefined);
      setIsConnected(true);
    } else {
      // Fallback vers Socket.IO
      console.log("[Realtime] Using Socket.IO fallback");
      const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
      socketRef.current = io(socketUrl, {
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      const socket = socketRef.current;

      socket.on("connect", () => {
        console.log("[Socket] Connected");
        setIsConnected(true);
        socket.emit("authenticate", { userId: user.id });
      });

      socket.on("authenticated", () => {
        console.log("[Socket] Authenticated");
      });

      socket.on("disconnect", () => {
        console.log("[Socket] Disconnected");
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("[Socket] Connection error:", error);
        setIsConnected(false);
      });

      socket.on("error", (error: { message: string }) => {
        console.error("[Socket] Error:", error.message);
      });
    }

    // Cleanup on unmount
    return () => {
      if (useSupabase) {
        supabaseRealtime.disconnect();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, user?.id, user?.name, useSupabase]);

  // Join a conversation room
  const joinConversation = useCallback((conversationId: number) => {
    if (useSupabase) {
      supabaseRealtime.joinConversation(conversationId);
    } else if (socketRef.current && user?.id) {
      socketRef.current.emit("join_conversation", {
        conversationId,
        userId: user.id,
      });
    }
  }, [user?.id, useSupabase]);

  // Leave a conversation room
  const leaveConversation = useCallback((conversationId: number) => {
    if (useSupabase) {
      supabaseRealtime.leaveConversation(conversationId);
    } else if (socketRef.current) {
      socketRef.current.emit("leave_conversation", { conversationId });
    }
  }, [useSupabase]);

  // Send a message
  const sendMessage = useCallback((
    conversationId: number,
    content: string,
    attachments?: string,
    tempId?: string
  ) => {
    if (useSupabase) {
      supabaseRealtime.sendMessage(conversationId, {
        content,
        attachments,
        tempId,
      });
    } else if (socketRef.current && user?.id) {
      socketRef.current.emit("send_message", {
        conversationId,
        senderId: user.id,
        content,
        attachments,
        tempId,
      });
    }
  }, [user?.id, useSupabase]);

  // Start typing indicator
  const startTyping = useCallback((conversationId: number) => {
    if (useSupabase) {
      supabaseRealtime.startTyping(conversationId);
    } else if (socketRef.current && user?.id) {
      socketRef.current.emit("typing_start", {
        conversationId,
        userId: user.id,
        userName: user.name,
      });
    }
  }, [user?.id, user?.name, useSupabase]);

  // Stop typing indicator
  const stopTyping = useCallback((conversationId: number) => {
    if (useSupabase) {
      supabaseRealtime.stopTyping(conversationId);
    } else if (socketRef.current && user?.id) {
      socketRef.current.emit("typing_stop", {
        conversationId,
        userId: user.id,
      });
    }
  }, [user?.id, useSupabase]);

  // Mark messages as read
  const markAsRead = useCallback((conversationId: number) => {
    if (useSupabase) {
      supabaseRealtime.markAsRead(conversationId);
    } else if (socketRef.current && user?.id) {
      socketRef.current.emit("mark_read", {
        conversationId,
        userId: user.id,
      });
    }
  }, [user?.id, useSupabase]);

  // Subscribe to new messages
  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    if (useSupabase) {
      return supabaseRealtime.onNewMessage(callback);
    } else if (socketRef.current) {
      socketRef.current.on("new_message", callback);
      return () => {
        socketRef.current?.off("new_message", callback);
      };
    }
    return () => {};
  }, [useSupabase]);

  // Subscribe to message sent confirmation
  const onMessageSent = useCallback((callback: (data: { success: boolean; messageId: number; tempId?: string }) => void) => {
    if (useSupabase) {
      // Supabase Realtime n'a pas de confirmation de message envoyé
      // Le message est considéré comme envoyé dès qu'il est broadcasté
      return () => {};
    } else if (socketRef.current) {
      socketRef.current.on("message_sent", callback);
      return () => {
        socketRef.current?.off("message_sent", callback);
      };
    }
    return () => {};
  }, [useSupabase]);

  // Subscribe to typing indicators
  const onTyping = useCallback((callback: (data: TypingUser) => void) => {
    if (useSupabase) {
      return supabaseRealtime.onTyping((data) => {
        // Update typing users map
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (data.isTyping) {
            newMap.set(data.userId, data);
            // Clear existing timeout
            const existingTimeout = typingTimeoutRef.current.get(data.userId);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
            // Set timeout to remove typing indicator after 3 seconds
            const timeout = setTimeout(() => {
              setTypingUsers(prev => {
                const newMap = new Map(prev);
                newMap.delete(data.userId);
                return newMap;
              });
            }, 3000);
            typingTimeoutRef.current.set(data.userId, timeout);
          } else {
            newMap.delete(data.userId);
          }
          return newMap;
        });
        callback(data);
      });
    } else if (socketRef.current) {
      const handler = (data: TypingUser) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (data.isTyping) {
            newMap.set(data.userId, data);
            const existingTimeout = typingTimeoutRef.current.get(data.userId);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
            const timeout = setTimeout(() => {
              setTypingUsers(prev => {
                const newMap = new Map(prev);
                newMap.delete(data.userId);
                return newMap;
              });
            }, 3000);
            typingTimeoutRef.current.set(data.userId, timeout);
          } else {
            newMap.delete(data.userId);
          }
          return newMap;
        });
        callback(data);
      };
      socketRef.current.on("user_typing", handler);
      return () => {
        socketRef.current?.off("user_typing", handler);
      };
    }
    return () => {};
  }, [useSupabase]);

  // Subscribe to messages read status
  const onMessagesRead = useCallback((callback: (data: { conversationId: number; readBy: number; readAt: string }) => void) => {
    if (useSupabase) {
      // Géré via le broadcast Supabase
      return () => {};
    } else if (socketRef.current) {
      socketRef.current.on("messages_read", callback);
      return () => {
        socketRef.current?.off("messages_read", callback);
      };
    }
    return () => {};
  }, [useSupabase]);

  // Subscribe to message notifications
  const onMessageNotification = useCallback((callback: (notification: MessageNotification) => void) => {
    if (useSupabase) {
      // Les notifications sont gérées via l'API
      return () => {};
    } else if (socketRef.current) {
      const handler = (notification: MessageNotification) => {
        toast.info(`${notification.senderName}: ${notification.preview}`, {
          action: {
            label: "Voir",
            onClick: () => {
              window.location.href = `/messages/${notification.conversationId}`;
            },
          },
        });
        callback(notification);
      };
      socketRef.current.on("message_notification", handler);
      return () => {
        socketRef.current?.off("message_notification", handler);
      };
    }
    return () => {};
  }, [useSupabase]);

  // Subscribe to user online status
  const onUserOnline = useCallback((callback: (data: { userId: number }) => void) => {
    if (useSupabase) {
      return supabaseRealtime.onUserOnline(callback);
    } else if (socketRef.current) {
      socketRef.current.on("user_online", callback);
      return () => {
        socketRef.current?.off("user_online", callback);
      };
    }
    return () => {};
  }, [useSupabase]);

  // Subscribe to user offline status
  const onUserOffline = useCallback((callback: (data: { userId: number }) => void) => {
    if (useSupabase) {
      return supabaseRealtime.onUserOffline(callback);
    } else if (socketRef.current) {
      socketRef.current.on("user_offline", callback);
      return () => {
        socketRef.current?.off("user_offline", callback);
      };
    }
    return () => {};
  }, [useSupabase]);

  // Subscribe to order status changes
  const onOrderStatusChanged = useCallback((callback: (data: {
    orderId: number;
    status: string;
    updatedBy: number;
    timestamp: string;
  }) => void) => {
    if (useSupabase) {
      // Les changements de statut de commande sont gérés via l'API
      return () => {};
    } else if (socketRef.current) {
      socketRef.current.on("order_status_changed", callback);
      return () => {
        socketRef.current?.off("order_status_changed", callback);
      };
    }
    return () => {};
  }, [useSupabase]);

  return {
    socket: socketRef.current,
    isConnected,
    typingUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    onNewMessage,
    onMessageSent,
    onTyping,
    onMessagesRead,
    onMessageNotification,
    onUserOnline,
    onUserOffline,
    onOrderStatusChanged,
  };
}

export default useSocket;
