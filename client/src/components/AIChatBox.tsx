import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Send, X, Loader2, User, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";

// ✅ Export de l'interface pour qu'elle soit accessible ailleurs
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

// ✅ Fonction nommée exportée directement
export function AIChatBox() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Bonjour ! Je suis l'assistant IA de Bénin Freelance. Comment puis-je vous aider à trouver le service idéal aujourd'hui ?",
      createdAt: new Date()
    }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      setTimeout(() => {
        const aiResponses = [
          "C'est noté ! Je peux vous aider à chercher cela.",
          "Excellente question. Sur Bénin Freelance, nous avons plusieurs experts dans ce domaine.",
          "Pourriez-vous préciser votre budget pour ce projet ?",
          "Je vous recommande de consulter la catégorie 'Développement Web' pour trouver les meilleurs profils."
        ];
        
        const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: randomResponse,
          createdAt: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error("Erreur IA:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="w-[350px] sm:w-[400px] shadow-2xl border-primary/20 overflow-hidden">
              <CardHeader className="bg-primary p-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-base">Assistant IA</CardTitle>
                    <p className="text-primary-foreground/80 text-xs">En ligne</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="p-0 flex flex-col h-[400px]">
                <ScrollArea className="flex-1 p-4 bg-slate-50/50">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar className="h-8 w-8 mt-1 border border-slate-200">
                          {msg.role === 'assistant' ? (
                            <>
                              <AvatarImage src="/bot-avatar.png" />
                              <AvatarFallback className="bg-primary/10 text-primary"><Cpu className="h-4 w-4" /></AvatarFallback>
                            </>
                          ) : (
                            <>
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback className="bg-slate-200"><User className="h-4 w-4" /></AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        
                        <div
                          className={`rounded-2xl px-4 py-2 text-sm max-w-[80%] shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
                          }`}
                        >
                          {msg.content}
                          <div className={`text-[10px] mt-1 opacity-70 text-right ${msg.role === 'user' ? 'text-primary-foreground' : 'text-slate-400'}`}>
                            {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-1 border border-slate-200">
                          <AvatarFallback className="bg-primary/10"><Cpu className="h-4 w-4 text-primary animate-pulse" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                <div className="p-3 bg-white border-t border-slate-100">
                  <form onSubmit={handleSend} className="relative flex items-center gap-2">
                    <Input
                      placeholder="Posez votre question..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="pr-10 rounded-full border-slate-200 focus-visible:ring-primary"
                      disabled={isLoading}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="absolute right-1 h-8 w-8 rounded-full"
                      disabled={!input.trim() || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <MessageSquare className="h-7 w-7" />
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white"></span>
        </motion.button>
      )}
    </div>
  );
}

// ✅ Export Default pour compatibilité
export default AIChatBox;