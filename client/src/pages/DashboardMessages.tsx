import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function DashboardMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Charger les conversations
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      // Simulation car la table conversation dépend de votre schéma
      // Voici une requête générique sur une table 'conversations' ou 'messages'
      // Si vous n'avez pas de table conversation, ce code devra être adapté
      // Supposons une table 'conversations' avec participant1_id et participant2_id
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:users!participant1_id(name, avatar),
          user2:users!participant2_id(name, avatar)
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);

      if (!error && data) {
        setConversations(data.map(c => ({
          ...c,
          otherUser: c.participant1_id === user.id ? c.user2 : c.user1
        })));
      }
      setIsLoading(false);
    };
    fetchConversations();
  }, [user]);

  // Charger les messages quand une conversation est sélectionnée
  useEffect(() => {
    if (!selectedConv) return;
    
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConv.id)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      // Scroll to bottom
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    fetchMessages();
    
    // Realtime subscription
    const channel = supabase
      .channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConv.id}` }, 
      (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    
    try {
      await supabase.from('messages').insert({
        conversation_id: selectedConv.id,
        sender_id: user?.id,
        content: newMessage
      });
      setNewMessage("");
    } catch (error) {
      toast.error("Erreur envoi");
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="h-[calc(100vh-200px)] grid grid-cols-3 gap-4">
      {/* Liste Conversations */}
      <Card className="col-span-1 overflow-y-auto">
        <CardContent className="p-0">
          {conversations.length > 0 ? conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${selectedConv?.id === conv.id ? 'bg-muted' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={conv.otherUser?.avatar} />
                  <AvatarFallback>{conv.otherUser?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{conv.otherUser?.name}</p>
                  <p className="text-xs text-muted-foreground">Cliquez pour voir</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-4 text-center text-muted-foreground">Pas de conversations</div>
          )}
        </CardContent>
      </Card>

      {/* Zone Chat */}
      <Card className="col-span-2 flex flex-col">
        {selectedConv ? (
          <>
            <div className="p-4 border-b font-bold flex items-center gap-2">
              {selectedConv.otherUser?.name}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-[70%] ${msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <div className="p-4 border-t flex gap-2">
              <Input 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez votre message..." 
              />
              <Button size="icon" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Sélectionnez une conversation
          </div>
        )}
      </Card>
    </div>
  );
}