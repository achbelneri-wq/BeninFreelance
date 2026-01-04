import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Shield,
  Zap,
  Trophy,
  MessageCircle,
  Heart,
  Briefcase,
} from "lucide-react";

interface FreelancerCardProps {
  freelancer: {
    id: number;
    name: string;
    avatar?: string;
    headline?: string;
    bio?: string;
    city?: string;
    country?: string;
    skills?: string[];
    rating?: number;
    total_reviews?: number;
    completed_orders?: number;
    hourly_rate?: number;
    response_time?: number;
    is_verified?: boolean;
    is_online?: boolean;
    badges?: string[];
    member_since?: string;
  };
  variant?: "default" | "compact" | "featured";
  showActions?: boolean;
  onFavorite?: (id: number) => void;
  isFavorite?: boolean;
}

export default function FreelancerCard({
  freelancer,
  variant = "default",
  showActions = true,
  onFavorite,
  isFavorite = false,
}: FreelancerCardProps) {
  const {
    id,
    name,
    avatar,
    headline,
    bio,
    city,
    country = "Bénin",
    skills = [],
    rating = 0,
    total_reviews = 0,
    completed_orders = 0,
    hourly_rate,
    response_time,
    is_verified,
    is_online,
    badges = [],
    member_since,
  } = freelancer;

  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const formatResponseTime = (minutes?: number) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}j`;
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case "verifie":
        return <Shield className="h-3 w-3" />;
      case "top-freelance":
        return <Trophy className="h-3 w-3" />;
      case "reponse-rapide":
        return <Zap className="h-3 w-3" />;
      default:
        return <CheckCircle className="h-3 w-3" />;
    }
  };

  if (variant === "compact") {
    return (
      <Link href={`/profile/${id}`}>
        <Card 
          className="group cursor-pointer transition-all duration-200 hover:shadow-md"
          style={{ 
            background: '#FFFDFB', 
            border: '1px solid #E8E2D9',
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-offset-2" style={{ ringColor: is_online ? '#5C6B4A' : '#E8E2D9' }}>
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback style={{ background: '#C75B39', color: '#FFFDFB' }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {is_online && (
                  <span 
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
                    style={{ background: '#5C6B4A' }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate" style={{ color: '#1A1714' }}>{name}</h4>
                  {is_verified && (
                    <Shield className="h-4 w-4 shrink-0" style={{ color: '#C75B39' }} />
                  )}
                </div>
                <p className="text-sm truncate" style={{ color: '#6B6560' }}>{headline || bio?.slice(0, 50)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" style={{ color: '#D4AF37' }} />
                    <span className="text-xs font-medium" style={{ color: '#1A1714' }}>
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-xs" style={{ color: '#9A948D' }}>
                      ({total_reviews})
                    </span>
                  </div>
                  {city && (
                    <>
                      <span style={{ color: '#E8E2D9' }}>•</span>
                      <span className="text-xs" style={{ color: '#6B6560' }}>{city}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card 
      className={`group transition-all duration-200 hover:shadow-lg ${variant === 'featured' ? 'ring-2' : ''}`}
      style={{ 
        background: '#FFFDFB', 
        border: '1px solid #E8E2D9',
        ringColor: variant === 'featured' ? '#C75B39' : undefined,
      }}
    >
      <CardContent className="p-0">
        {/* Header avec avatar et infos principales */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            <Link href={`/profile/${id}`}>
              <div className="relative cursor-pointer">
                <Avatar className="h-16 w-16 ring-2 ring-offset-2 transition-transform group-hover:scale-105" style={{ ringColor: is_online ? '#5C6B4A' : '#E8E2D9' }}>
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback 
                    className="text-lg font-semibold"
                    style={{ background: '#C75B39', color: '#FFFDFB' }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {is_online && (
                  <span 
                    className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white"
                    style={{ background: '#5C6B4A' }}
                    title="En ligne"
                  />
                )}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/profile/${id}`}>
                    <h3 
                      className="font-semibold text-lg hover:underline cursor-pointer"
                      style={{ color: '#1A1714', fontFamily: 'Playfair Display, serif' }}
                    >
                      {name}
                    </h3>
                  </Link>
                  {headline && (
                    <p className="text-sm mt-0.5" style={{ color: '#6B6560' }}>
                      {headline}
                    </p>
                  )}
                </div>
                
                {showActions && onFavorite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      onFavorite(id);
                    }}
                  >
                    <Heart 
                      className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-current' : ''}`}
                      style={{ color: isFavorite ? '#C75B39' : '#9A948D' }}
                    />
                  </Button>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {is_verified && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs gap-1"
                    style={{ background: '#C75B39', color: '#FFFDFB' }}
                  >
                    <Shield className="h-3 w-3" />
                    Vérifié
                  </Badge>
                )}
                {badges.includes('top-freelance') && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs gap-1"
                    style={{ background: '#D4AF37', color: '#1A1714' }}
                  >
                    <Trophy className="h-3 w-3" />
                    Top
                  </Badge>
                )}
                {response_time && response_time < 120 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs gap-1"
                    style={{ background: '#5C6B4A', color: '#FFFDFB' }}
                  >
                    <Zap className="h-3 w-3" />
                    Répond vite
                  </Badge>
                )}
              </div>

              {/* Localisation */}
              {city && (
                <div className="flex items-center gap-1 mt-2">
                  <MapPin className="h-3.5 w-3.5" style={{ color: '#9A948D' }} />
                  <span className="text-sm" style={{ color: '#6B6560' }}>
                    {city}, {country}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bio courte */}
          {bio && (
            <p 
              className="mt-3 text-sm line-clamp-2"
              style={{ color: '#3D3833' }}
            >
              {bio}
            </p>
          )}

          {/* Compétences */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {skills.slice(0, 5).map((skill, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
                >
                  {skill}
                </Badge>
              ))}
              {skills.length > 5 && (
                <Badge 
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: '#E8E2D9', color: '#9A948D' }}
                >
                  +{skills.length - 5}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Footer avec stats */}
        <div 
          className="px-5 py-3 flex items-center justify-between border-t"
          style={{ borderColor: '#E8E2D9', background: '#FAF7F2' }}
        >
          <div className="flex items-center gap-4">
            {/* Note */}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-current" style={{ color: '#D4AF37' }} />
              <span className="font-semibold" style={{ color: '#1A1714' }}>
                {rating.toFixed(1)}
              </span>
              <span className="text-sm" style={{ color: '#9A948D' }}>
                ({total_reviews} avis)
              </span>
            </div>

            {/* Projets complétés */}
            <div className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" style={{ color: '#9A948D' }} />
              <span className="text-sm" style={{ color: '#6B6560' }}>
                {completed_orders} projets
              </span>
            </div>

            {/* Temps de réponse */}
            {response_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" style={{ color: '#9A948D' }} />
                <span className="text-sm" style={{ color: '#6B6560' }}>
                  {formatResponseTime(response_time)}
                </span>
              </div>
            )}
          </div>

          {/* Tarif */}
          {hourly_rate && (
            <div className="text-right">
              <span className="font-bold text-lg" style={{ color: '#C75B39' }}>
                {hourly_rate.toLocaleString()} FCFA
              </span>
              <span className="text-sm" style={{ color: '#9A948D' }}>/h</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div 
            className="px-5 py-3 flex gap-2 border-t"
            style={{ borderColor: '#E8E2D9' }}
          >
            <Link href={`/profile/${id}`} className="flex-1">
              <Button 
                variant="outline" 
                className="w-full"
                style={{ borderColor: '#C75B39', color: '#C75B39' }}
              >
                Voir le profil
              </Button>
            </Link>
            <Link href={`/messages?user=${id}`}>
              <Button 
                className="gap-2"
                style={{ background: '#C75B39', color: '#FFFDFB' }}
              >
                <MessageCircle className="h-4 w-4" />
                Contacter
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
