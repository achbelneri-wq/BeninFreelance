import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/GoogleIcon";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";
// SUPPRIMÉ: import { trpc } from "@/lib/trpc"; 
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  User,
  Briefcase,
  Users,
  Check,
  ArrowLeft,
  RefreshCw
} from "lucide-react";

type UserType = "client" | "freelance";

export default function Register() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Type, 2: Info, 3: Vérification
  const [userType, setUserType] = useState<UserType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // États pour la vérification par code
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown pour le renvoi du code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Inscription via Email
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (!acceptTerms) {
      toast.error("Veuillez accepter les conditions d'utilisation");
      return;
    }

    setIsLoading(true);
    try {
      // Créer le compte avec Supabase
      // Supabase enverra automatiquement un email de confirmation (Link ou OTP selon config)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            name: name,
            userType: userType || "client",
            is_seller: userType === "freelance"
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Si l'utilisateur est créé mais pas confirmé
        if (data.user.identities?.length === 0) {
           toast.error("Cet email est déjà utilisé par un autre compte.");
           return;
        }

        toast.success("Compte créé ! Veuillez vérifier votre email.");
        // Redirection vers la page de vérification
        setTimeout(() => {
          setLocation(`/verify-email?email=${encodeURIComponent(email)}`);
        }, 1000);
      }

    } catch (error: any) {
      if (error.message?.includes("already registered") || error.message?.includes("unique constraint")) {
        toast.error("Cet email est déjà utilisé");
      } else {
        toast.error(error.message || "Erreur lors de l'inscription");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la saisie du code de vérification
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Si l'utilisateur colle un code complet
      const pastedCode = value.slice(0, 6).split("");
      const newCode = [...verificationCode];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setVerificationCode(newCode);
      // Focus sur le dernier champ rempli ou le suivant
      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      // Auto-focus sur le champ suivant
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Gérer la touche Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Vérifier le code (Supabase OTP)
  const handleVerifyCode = async () => {
    const code = verificationCode.join("");
    if (code.length !== 6) {
      toast.error("Veuillez entrer le code complet à 6 chiffres");
      return;
    }

    setIsLoading(true);
    try {
      // Vérification native Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup'
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Email vérifié avec succès ! Bienvenue.");
        // Redirection vers le dashboard approprié
        if (userType === 'freelance') {
            setLocation("/dashboard");
        } else {
            setLocation("/services"); // Ou dashboard client
        }
      } else {
        // Fallback si la session n'est pas créée immédiatement
        setLocation("/login");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Code invalide ou expiré.");
      setVerificationCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Renvoyer le code (Supabase Resend)
  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success("Un nouveau code a été envoyé");
      setCountdown(60);
      setVerificationCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error(error.message || "Impossible de renvoyer le code (vérifiez si le compte est déjà actif)");
    } finally {
      setIsResending(false);
    }
  };

  // Inscription Google
  const handleGoogleRegister = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error("Erreur Google : " + error.message);
    }
  };

  const userTypeOptions = [
    {
      type: "client" as UserType,
      icon: Briefcase,
      title: "Je suis Client",
      description: "Je cherche des freelances pour mes projets",
      features: ["Publier des projets", "Commander des services", "Gérer mes commandes"]
    },
    {
      type: "freelance" as UserType,
      icon: Users,
      title: "Je suis Freelance",
      description: "Je propose mes services et compétences",
      features: ["Créer des services", "Postuler aux projets", "Gérer mes revenus"]
    }
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#FAF7F2' }}>
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FAF7F2 0%, #E8E2D9 100%)' }}>
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(199, 91, 57, 0.08)' }} />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full blur-[80px]" style={{ background: 'rgba(92, 107, 74, 0.06)' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link href="/">
            <Logo className="mb-12" />
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-block w-8 h-[2px]" style={{ background: '#C75B39' }}></span>
              <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#C75B39' }}>
                Plateforme béninoise
              </span>
            </div>

            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714', letterSpacing: '-0.02em' }}>
              Rejoignez la
              <br />
              <span style={{ color: '#C75B39', fontStyle: 'italic' }}>
                communauté
              </span>
            </h1>
            <p className="text-lg max-w-md" style={{ color: '#6B6560', lineHeight: 1.8 }}>
              Créez votre compte et commencez à collaborer avec les meilleurs talents du Bénin.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 space-y-4"
          >
            {[
              "Inscription 100% gratuite",
              "Paiements sécurisés via Mobile Money",
              "Support client 24/7",
              "Communauté active de professionnels"
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(92, 107, 74, 0.15)' }}>
                  <Check className="w-4 h-4" style={{ color: '#5C6B4A' }} />
                </div>
                <span style={{ color: '#3D3833' }}>{benefit}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto" style={{ background: '#FAF7F2' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/">
              <Logo className="inline-block" />
            </Link>
          </div>

          <Card className="p-8" style={{ background: '#FFFDFB', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            {/* Step 1: Choose User Type */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm mb-4" style={{ background: 'rgba(199, 91, 57, 0.08)', border: '1px solid rgba(199, 91, 57, 0.15)' }}>
                    <span className="text-sm font-bold" style={{ color: '#C75B39' }}>1</span>
                    <span className="text-sm font-medium" style={{ color: '#C75B39' }}>Étape 1/3</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                    Qui êtes-vous ?
                  </h2>
                  <p style={{ color: '#6B6560' }}>
                    Choisissez votre profil pour personnaliser votre expérience
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {userTypeOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => setUserType(option.type)}
                      className="w-full p-4 rounded-sm text-left transition-all"
                      style={{
                        background: userType === option.type ? 'rgba(199, 91, 57, 0.05)' : '#FFFDFB',
                        border: userType === option.type ? '2px solid #C75B39' : '1px solid #E8E2D9'
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-sm flex items-center justify-center" style={{
                          background: userType === option.type ? 'rgba(199, 91, 57, 0.1)' : '#E8E2D9'
                        }}>
                          <option.icon className="w-6 h-6" style={{
                            color: userType === option.type ? '#C75B39' : '#6B6560'
                          }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1" style={{
                            color: userType === option.type ? '#C75B39' : '#1A1714'
                          }}>
                            {option.title}
                          </h3>
                          <p className="text-sm mb-2" style={{ color: '#6B6560' }}>{option.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {option.features.map((feature, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 rounded-sm"
                                style={{ background: '#E8E2D9', color: '#6B6560' }}
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        {userType === option.type && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#C75B39' }}>
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => userType && setStep(2)}
                  disabled={!userType}
                  className="w-full h-12 font-medium disabled:opacity-50"
                  style={{ background: '#C75B39', color: '#FFFDFB' }}
                >
                  Continuer
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <p className="text-center mt-6" style={{ color: '#6B6560' }}>
                  Déjà un compte ?{" "}
                  <Link href="/login" className="font-medium" style={{ color: '#C75B39' }}>
                    Se connecter
                  </Link>
                </p>
              </motion.div>
            )}

            {/* Step 2: Account Details */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm mb-4" style={{ background: 'rgba(199, 91, 57, 0.08)', border: '1px solid rgba(199, 91, 57, 0.15)' }}>
                    <span className="text-sm font-bold" style={{ color: '#C75B39' }}>2</span>
                    <span className="text-sm font-medium" style={{ color: '#C75B39' }}>Étape 2/3</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                    Créez votre compte
                  </h2>
                  <p style={{ color: '#6B6560' }}>
                    {userType === "client" ? "Compte Client" : "Compte Freelance"}
                  </p>
                </div>

                {/* Google Register */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 mb-6 flex items-center justify-center gap-3"
                  style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#3D3833' }}
                  onClick={handleGoogleRegister}
                >
                  <GoogleIcon className="w-5 h-5" />
                  <span>S'inscrire avec Google</span>
                </Button>

                <div className="relative mb-6">
                  <Separator style={{ background: '#E8E2D9' }} />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 text-sm" style={{ background: '#FFFDFB', color: '#9A948D' }}>
                    ou
                  </span>
                </div>

                {/* Email Register Form */}
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" style={{ color: '#3D3833' }}>Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9A948D' }} />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Jean Dupont"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-11 h-12"
                        style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#1A1714' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" style={{ color: '#3D3833' }}>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9A948D' }} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12"
                        style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#1A1714' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" style={{ color: '#3D3833' }}>Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9A948D' }} />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-12"
                        style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#1A1714' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#9A948D' }}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" style={{ color: '#3D3833' }}>Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9A948D' }} />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-11 h-12"
                        style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#1A1714' }}
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 rounded"
                      style={{ borderColor: '#E8E2D9', accentColor: '#C75B39' }}
                    />
                    <span className="text-sm" style={{ color: '#6B6560' }}>
                      J'accepte les{" "}
                      <Link href="/terms" style={{ color: '#C75B39' }}>
                        conditions d'utilisation
                      </Link>{" "}
                      et la{" "}
                      <Link href="/privacy" style={{ color: '#C75B39' }}>
                        politique de confidentialité
                      </Link>
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="h-12 px-6"
                      style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#3D3833' }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-12 font-medium"
                      style={{ background: '#C75B39', color: '#FFFDFB' }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Continuer
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <p className="text-center mt-6" style={{ color: '#6B6560' }}>
                  Déjà un compte ?{" "}
                  <Link href="/login" className="font-medium" style={{ color: '#C75B39' }}>
                    Se connecter
                  </Link>
                </p>
              </motion.div>
            )}

            {/* Step 3: Email Verification */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm mb-4" style={{ background: 'rgba(199, 91, 57, 0.08)', border: '1px solid rgba(199, 91, 57, 0.15)' }}>
                    <span className="text-sm font-bold" style={{ color: '#C75B39' }}>3</span>
                    <span className="text-sm font-medium" style={{ color: '#C75B39' }}>Étape 3/3</span>
                  </div>

                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(199, 91, 57, 0.1)' }}>
                    <Mail className="w-8 h-8" style={{ color: '#C75B39' }} />
                  </div>

                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}>
                    Vérifiez votre email
                  </h2>
                  <p style={{ color: '#6B6560' }}>
                    Un email de confirmation a été envoyé à :
                  </p>
                  <p className="font-medium mt-1" style={{ color: '#1A1714' }}>
                    {email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Entrez le code reçu ou cliquez sur le lien dans l'email.
                  </p>
                </div>

                {/* Code Input */}
                <div className="flex justify-center gap-2 mb-6">
                  {verificationCode.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-bold"
                      style={{ 
                        background: '#FFFDFB', 
                        border: digit ? '2px solid #C75B39' : '1px solid #E8E2D9', 
                        color: '#1A1714' 
                      }}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleVerifyCode}
                  disabled={isLoading || verificationCode.join("").length !== 6}
                  className="w-full h-12 font-medium mb-4"
                  style={{ background: '#C75B39', color: '#FFFDFB' }}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Vérifier le code
                      <Check className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                {/* Resend Code */}
                <div className="text-center">
                  <p className="text-sm mb-2" style={{ color: '#6B6560' }}>
                    Vous n'avez pas reçu le code ?
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendCode}
                    disabled={countdown > 0 || isResending}
                    className="text-sm"
                    style={{ color: countdown > 0 ? '#9A948D' : '#C75B39' }}
                  >
                    {isResending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
                  </Button>
                </div>

                {/* Back Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="w-full h-12 mt-4"
                  style={{ background: '#FFFDFB', border: '1px solid #E8E2D9', color: '#3D3833' }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Modifier l'email
                </Button>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}