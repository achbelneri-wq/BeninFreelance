import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "waiting">("waiting");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(params.get("email") || "");

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Récupérer le token depuis l'URL (Supabase ajoute #access_token=...)
        const hash = window.location.hash;
        
        if (hash) {
          setStatus("loading");
          
          // Supabase gère automatiquement la vérification du lien
          // On peut vérifier la session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (session) {
            setStatus("success");
            setMessage("Email vérifié avec succès ! Redirection en cours...");
            
            // Redirection après 2 secondes
            setTimeout(() => {
              setLocation("/dashboard");
            }, 2000);
          } else {
            setStatus("waiting");
          }
        }
      } catch (error: any) {
        console.error("Erreur vérification:", error);
        setStatus("error");
        setMessage(error.message || "Erreur lors de la vérification");
      }
    };

    verifyToken();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF7F2" }}>
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4 pt-24">
        <Card className="w-full max-w-md p-8" style={{ background: "#FFFDFB", border: "1px solid #E8E2D9" }}>
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-8">
              <Logo size="md" />
            </div>

            {/* Status Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" 
              style={{ background: status === "success" ? "rgba(92, 107, 74, 0.1)" : "rgba(199, 91, 57, 0.1)" }}>
              {status === "loading" && (
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#C75B39" }} />
              )}
              {status === "success" && (
                <CheckCircle className="w-8 h-8" style={{ color: "#5C6B4A" }} />
              )}
              {status === "error" && (
                <AlertCircle className="w-8 h-8" style={{ color: "#B54A4A" }} />
              )}
              {status === "waiting" && (
                <Mail className="w-8 h-8" style={{ color: "#C75B39" }} />
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "Playfair Display, serif", color: "#1A1714" }}>
              {status === "success" && "Email vérifié !"}
              {status === "error" && "Erreur de vérification"}
              {status === "loading" && "Vérification en cours..."}
              {status === "waiting" && "Vérifiez votre email"}
            </h1>

            {/* Message */}
            <p className="mb-6" style={{ color: "#6B6560" }}>
              {status === "success" && "Votre email a été vérifié avec succès. Bienvenue sur BeninFreelance !"}
              {status === "error" && message}
              {status === "loading" && "Nous vérifions votre email..."}
              {status === "waiting" && (
                <>
                  Un email de confirmation a été envoyé à :<br />
                  <span className="font-medium" style={{ color: "#1A1714" }}>{email}</span>
                </>
              )}
            </p>

            {/* Instructions for waiting status */}
            {status === "waiting" && (
              <div className="bg-[#C75B39]/5 border border-[#C75B39]/20 rounded-sm p-4 mb-6 text-left w-full">
                <p className="text-sm mb-3" style={{ color: "#1A1714" }}>
                  <strong>Que faire ?</strong>
                </p>
                <ul className="text-sm space-y-2" style={{ color: "#6B6560" }}>
                  <li>✓ Ouvrez votre email</li>
                  <li>✓ Cliquez sur le lien de confirmation</li>
                  <li>✓ Vous serez automatiquement connecté</li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 w-full">
              {status === "success" && (
                <Button
                  onClick={() => setLocation("/dashboard")}
                  className="w-full h-12 font-medium"
                  style={{ background: "#C75B39", color: "#FFFDFB" }}
                >
                  Aller au tableau de bord
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}

              {status === "error" && (
                <>
                  <Button
                    onClick={() => setLocation("/register")}
                    className="w-full h-12 font-medium"
                    style={{ background: "#C75B39", color: "#FFFDFB" }}
                  >
                    Recommencer l'inscription
                  </Button>
                  <Button
                    onClick={() => setLocation("/login")}
                    variant="outline"
                    className="w-full h-12"
                    style={{ background: "#FFFDFB", border: "1px solid #E8E2D9", color: "#3D3833" }}
                  >
                    Se connecter
                  </Button>
                </>
              )}

              {status === "waiting" && (
                <>
                  <Button
                    onClick={() => setLocation("/login")}
                    className="w-full h-12 font-medium"
                    style={{ background: "#C75B39", color: "#FFFDFB" }}
                  >
                    Déjà confirmé ? Se connecter
                  </Button>
                  <Button
                    onClick={() => setLocation("/register")}
                    variant="outline"
                    className="w-full h-12"
                    style={{ background: "#FFFDFB", border: "1px solid #E8E2D9", color: "#3D3833" }}
                  >
                    Retour à l'inscription
                  </Button>
                </>
              )}
            </div>

            {/* Help Text */}
            <p className="text-xs mt-6" style={{ color: "#9A948D" }}>
              Besoin d'aide ? Contactez{" "}
              <a href="mailto:contact@beninfreelance.com" style={{ color: "#C75B39" }} className="underline">
                contact@beninfreelance.com
              </a>
            </p>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
