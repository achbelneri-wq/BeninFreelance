export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Catégories de services disponibles sur la plateforme
 * Ces catégories doivent correspondre à celles de la base de données
 */
export const CATEGORIES = [
  { slug: 'developpement-web', name: 'Développement Web', icon: 'Code' },
  { slug: 'design-graphique', name: 'Design Graphique', icon: 'Palette' },
  { slug: 'redaction', name: 'Rédaction & Traduction', icon: 'PenTool' },
  { slug: 'video-animation', name: 'Vidéo & Animation', icon: 'Video' },
  { slug: 'musique-audio', name: 'Musique & Audio', icon: 'Music' },
  { slug: 'marketing-digital', name: 'Marketing Digital', icon: 'Megaphone' },
  { slug: 'business', name: 'Business & Consulting', icon: 'BarChart3' },
  { slug: 'formation', name: 'Formation & Coaching', icon: 'GraduationCap' },
  { slug: 'photographie', name: 'Photographie', icon: 'Camera' },
  { slug: 'data-analytics', name: 'Data & Analytics', icon: 'Database' },
  { slug: 'mobile-app', name: 'Applications Mobiles', icon: 'Smartphone' },
  { slug: 'autres', name: 'Autres Services', icon: 'Briefcase' },
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'];

/**
 * Statuts des commandes
 */
export const ORDER_STATUSES = {
  pending: { label: 'En attente', color: '#8B4513' },
  in_progress: { label: 'En cours', color: '#5C6B4A' },
  delivered: { label: 'Livré', color: '#C75B39' },
  completed: { label: 'Terminé', color: '#5C6B4A' },
  cancelled: { label: 'Annulé', color: '#9A948D' },
  disputed: { label: 'Litige', color: '#DC2626' },
} as const;

/**
 * Statuts KYC
 */
export const KYC_STATUSES = {
  pending: { label: 'En attente', color: '#8B4513' },
  submitted: { label: 'Soumis', color: '#C75B39' },
  verified: { label: 'Vérifié', color: '#5C6B4A' },
  rejected: { label: 'Rejeté', color: '#DC2626' },
} as const;

/**
 * Types de transactions
 */
export const TRANSACTION_TYPES = {
  deposit: { label: 'Dépôt', icon: 'ArrowDownLeft' },
  withdrawal: { label: 'Retrait', icon: 'ArrowUpRight' },
  earning: { label: 'Gain', icon: 'TrendingUp' },
  payment: { label: 'Paiement', icon: 'CreditCard' },
  refund: { label: 'Remboursement', icon: 'RotateCcw' },
  fee: { label: 'Frais', icon: 'Percent' },
} as const;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // If OAuth is not configured, return a local login page
  if (!oauthPortalUrl || !appId) {
    return "/login";
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/**
 * Configuration de l'application
 */
export const APP_CONFIG = {
  name: 'BeninFreelance',
  description: 'La première plateforme freelance du Bénin',
  currency: 'XOF',
  currencySymbol: 'F CFA',
  locale: 'fr-FR',
  platformFeePercent: 10,
  minWithdrawal: 5000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  supportedDocTypes: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;
