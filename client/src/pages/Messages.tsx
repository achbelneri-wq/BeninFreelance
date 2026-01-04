import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
// SUPPRIMÉ: import { trpc } from "@/lib/trpc";
// SUPPRIMÉ: import { useSocket } from "@/hooks/useSocket"; // On remplace par Supabase Realtime
import { supabase } from "@/lib/supabase"; // AJOUT
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Loader2,
  ArrowLeft,
  Search,
  Paperclip,
  Image as ImageIcon,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  Circle,
} from "lucide-react";
import { getLoginUrl } from "@/const";

interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  status?: 'sending' | 'sent' | 'read';
}

export default function Messages() {
  // On récupère l'ID de l'URL (ex: /messages/123)
  // Note: wouter useParams renvoie un objet string
  const params = useParams(); 
  const conversationId = params.id ? parseInt(params.id) : null;

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // États UI
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // États Données
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Pour la conversation active
  const [activeConversation, setActiveConversation] = useState<any>(null);

  // 1. Charger la liste des conversations
  const fetchConversations = async () => {
    if (!user) return;
    try {
      // Cette requête dépend de votre structure de table 'conversations' ou 'messages'
      // Option A: Table 'conversations' dédiée
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:users!participant1_id(*),
          user2:users!participant2_id(*)
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Formater pour l'affichage (trouver l'autre utilisateur)
      const formatted = data.map(c => {
        const otherUser = c.participant1_id === user.id ? c.user2 : c.user1;
        return {
          id: c.id,
          otherUser,
          lastMessage: c.last_message,
          lastMessageAt: c.updated_at,
          // unreadCount: c.unread_count // Si géré en base
        };
      });
      setConversations(formatted);
      
      // Définir la conversation active si ID présent
      if (conversationId) {
        const active = formatted.find(c => c.id === conversationId);
        setActiveConversation(active);
      }
    } catch (error) {
      console.error("Erreur conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Abonnement Realtime pour la liste des conversations
    if (!user) return;
    const channel = supabase
      .channel('conversations_list')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations', filter: `participant1_id=eq.${user.id}` }, 
        () => fetchConversations()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations', filter: `participant2_id=eq.${user.id}` }, 
        () => fetchConversations()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, conversationId]);

  // 2. Charger les messages de la conversation active
  useEffect(() => {
    if (!conversationId || !user) return;

    setLoadingMessages(true);
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error) {
        setMessages(data as any || []);
        // Marquer comme lu
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('is_read', false);
      }
      setLoadingMessages(false);
    };

    fetchMessages();

    // Abonnement Realtime pour les messages
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as any]);
          // Si le message n'est pas de moi, le marquer comme lu
          if (payload.new.sender_id !== user.id) {
             supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', payload.new.id);
          }
        }
      )
      // Écouter les mises à jour (ex: lu)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as any : m));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user]);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user) return;

    const content = newMessage.trim();
    setNewMessage(""); // Clear input immediately

    // Optimistic UI (Optionnel, ici on attend le retour realtime pour simplifier)
    
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content,
        is_read: false
      });

      if (error) throw error;

      // Mettre à jour la conversation (dernier message)
      await supabase
        .from('conversations')
        .update({ last_message: content, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      toast.error("Erreur lors de l'envoi");
      console.error(error);
    }
  };

  // Filtrage local
  const filteredConversations = conversations.filter((c: any) => 
    c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const otherUser = activeConversation?.otherUser;

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-heading text-xl font-semibold mb-2">Connexion requise</h2>
            <p className="text-muted-foreground mb-4">
              Connectez-vous pour accéder à vos messages.
            </p>
            <a href={getLoginUrl()}>
              <Button className="btn-benin">Se connecter</Button>
            </a>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container py-6">
        <div className="h-[calc(100vh-200px)] flex rounded-lg border overflow-hidden bg-card">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r flex flex-col ${conversationId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-semibold text-lg">Messages</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="divide-y">
                  {filteredConversations.map((conv: any) => (
                    <Link key={conv.id} href={`/dashboard/messages?id=${conv.id}`} onClick={() => { /* Hack pour wouter: force reload if needed or better routing */}}>
                      <div className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                        conv.id === conversationId ? 'bg-muted' : ''
                      }`} onClick={() => setLocation(`/dashboard/messages?id=${conv.id}`)}>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conv.otherUser?.avatar || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {conv.otherUser?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">
                                {conv.otherUser?.name || "Utilisateur"}
                              </p>
                              {conv.lastMessageAt && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(conv.lastMessageAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                            {conv.lastMessage && (
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.lastMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Aucune conversation
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!conversationId ? 'hidden md:flex' : 'flex'}`}>
            {conversationId && otherUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setLocation("/dashboard/messages")}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Link href={`/profile/${otherUser.id}`}>
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherUser.avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {otherUser.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </Link>
                    <div>
                      <Link href={`/profile/${otherUser.id}`} className="font-medium hover:text-primary">
                        {otherUser.name || "Utilisateur"}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {otherUser.is_seller ? "Freelance" : "Client"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isOwn = message.sender_id === user?.id;
                        const showDate = index === 0 || 
                          new Date(message.created_at).toDateString() !== 
                          new Date(messages[index - 1].created_at).toDateString();

                        return (
                          <div key={message.id}>
                            {showDate && (
                              <div className="flex items-center justify-center my-4">
                                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                  {new Date(message.created_at).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                  })}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                <div className={`rounded-2xl px-4 py-2 ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                    : 'bg-muted rounded-bl-md'
                                }`}>
                                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {isOwn && (
                                    message.is_read 
                                      ? <CheckCheck className="h-3 w-3 text-primary" />
                                      : <Check className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          Dites bonjour 👋
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Écrivez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim()}
                      className="btn-benin flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-heading font-semibold text-lg mb-2">
                    Vos messages
                  </h3>
                  <p className="text-muted-foreground">
                    Sélectionnez une conversation pour commencer
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}