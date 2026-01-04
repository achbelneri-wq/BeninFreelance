import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Clock,
  MapPin,
  Eye,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Users,
  Calendar,
  AlertCircle,
  Zap,
  DollarSign,
  Flag,
} from "lucide-react";

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    budget_min?: number;
    budget_max?: number;
    budget_type?: string;
    deadline?: string;
    skills_required?: string[];
    status: string;
    urgency?: string;
    experience_level?: string;
    project_length?: string;
    location_preference?: string;
    preferred_city?: string;
    proposals_count?: number;
    views_count?: number;
    is_featured?: boolean;
    created_at: string;
    client?: {
      id: number;
      name: string;
      avatar?: string;
      country?: string;
      is_verified?: boolean;
      total_projects?: number;
    };
  };
  variant?: "default" | "compact" | "list";
  showClient?: boolean;
  onBookmark?: (id: number) => void;
  isBookmarked?: boolean;
}

export default function ProjectCard({
  project,
  variant = "default",
  showClient = true,
  onBookmark,
  isBookmarked = false,
}: ProjectCardProps) {
  const {
    id,
    title,
    description,
    category,
    subcategory,
    budget_min,
    budget_max,
    budget_type = "fixed",
    deadline,
    skills_required = [],
    status,
    urgency = "normal",
    experience_level,
    project_length,
    location_preference,
    preferred_city,
    proposals_count = 0,
    views_count = 0,
    is_featured,
    created_at,
    client,
  } = project;

  const formatBudget = () => {
    if (!budget_min && !budget_max) return "À discuter";
    if (budget_min && budget_max) {
      if (budget_min === budget_max) {
        return `${budget_min.toLocaleString()} FCFA`;
      }
      return `${budget_min.toLocaleString()} - ${budget_max.toLocaleString()} FCFA`;
    }
    if (budget_min) return `À partir de ${budget_min.toLocaleString()} FCFA`;
    if (budget_max) return `Jusqu'à ${budget_max.toLocaleString()} FCFA`;
    return "À discuter";
  };

  const getBudgetRange = () => {
    if (!budget_max) return null;
    if (budget_max < 50000) return "Moins de 50 000 FCFA";
    if (budget_max < 200000) return "50 000 - 200 000 FCFA";
    if (budget_max < 500000) return "200 000 - 500 000 FCFA";
    if (budget_max < 1000000) return "500 000 - 1 000 000 FCFA";
    return "Plus de 1 000 000 FCFA";
  };

  const getStatusBadge = () => {
    switch (status) {
      case "open":
        return { label: "Ouvert", color: "#5C6B4A", bg: "#E8F5E9" };
      case "in_progress":
        return { label: "En cours", color: "#C75B39", bg: "#FFF3E0" };
      case "completed":
        return { label: "Terminé", color: "#6B6560", bg: "#E8E2D9" };
      case "cancelled":
        return { label: "Annulé", color: "#9A948D", bg: "#F5F5F5" };
      default:
        return { label: status, color: "#6B6560", bg: "#E8E2D9" };
    }
  };

  const getUrgencyBadge = () => {
    switch (urgency) {
      case "urgent":
        return { label: "Urgent", color: "#FFFDFB", bg: "#C75B39" };
      case "high":
        return { label: "Prioritaire", color: "#C75B39", bg: "#FFF3E0" };
      default:
        return null;
    }
  };

  const statusBadge = getStatusBadge();
  const urgencyBadge = getUrgencyBadge();
  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: fr });

  if (variant === "list") {
    return (
      <Card 
        className={`group transition-all duration-200 hover:shadow-md ${is_featured ? 'ring-2' : ''}`}
        style={{ 
          background: '#FFFDFB', 
          border: '1px solid #E8E2D9',
          ringColor: is_featured ? '#D4AF37' : undefined,
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Infos principales */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/projects/${id}`}>
                    <h3 
                      className="font-semibold text-lg hover:underline cursor-pointer line-clamp-1"
                      style={{ color: '#C75B39', fontFamily: 'Playfair Display, serif' }}
                    >
                      {title}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge 
                      variant="secondary"
                      className="text-xs"
                      style={{ background: statusBadge.bg, color: statusBadge.color }}
                    >
                      {statusBadge.label}
                    </Badge>
                    
                    <span className="text-sm" style={{ color: '#6B6560' }}>
                      {formatBudget()}
                    </span>
                    
                    <span style={{ color: '#E8E2D9' }}>•</span>
                    
                    <span className="text-sm" style={{ color: '#9A948D' }}>
                      {proposals_count} offre{proposals_count > 1 ? 's' : ''}
                    </span>
                    
                    <span style={{ color: '#E8E2D9' }}>•</span>
                    
                    <span className="text-sm" style={{ color: '#9A948D' }}>
                      {views_count} vue{views_count > 1 ? 's' : ''}
                    </span>
                    
                    {urgencyBadge && (
                      <Badge 
                        className="text-xs gap-1"
                        style={{ background: urgencyBadge.bg, color: urgencyBadge.color }}
                      >
                        <Zap className="h-3 w-3" />
                        {urgencyBadge.label}
                      </Badge>
                    )}
                  </div>
                </div>

                {onBookmark && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      onBookmark(id);
                    }}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="h-5 w-5" style={{ color: '#C75B39' }} />
                    ) : (
                      <Bookmark className="h-5 w-5" style={{ color: '#9A948D' }} />
                    )}
                  </Button>
                )}
              </div>

              <p 
                className="mt-2 text-sm line-clamp-2"
                style={{ color: '#3D3833' }}
              >
                {description}
              </p>

              {/* Compétences */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {skills_required.slice(0, 4).map((skill, index) => (
                  <span 
                    key={index}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: '#FAF7F2', color: '#6B6560' }}
                  >
                    {skill}
                  </span>
                ))}
                {skills_required.length > 4 && (
                  <span className="text-xs" style={{ color: '#9A948D' }}>
                    +{skills_required.length - 4}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: '#E8E2D9' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: '#9A948D' }}>
                    {timeAgo}
                  </span>
                  
                  {showClient && client && (
                    <>
                      <span style={{ color: '#E8E2D9' }}>•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: '#6B6560' }}>
                          par Client #{client.id}
                        </span>
                        {client.country && (
                          <Flag className="h-3 w-3" style={{ color: '#9A948D' }} />
                        )}
                      </div>
                    </>
                  )}
                </div>

                <Link href={`/projects/${id}`}>
                  <Button 
                    size="sm"
                    style={{ background: '#C75B39', color: '#FFFDFB' }}
                  >
                    Voir le projet
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant default (card)
  return (
    <Card 
      className={`group transition-all duration-200 hover:shadow-lg ${is_featured ? 'ring-2' : ''}`}
      style={{ 
        background: '#FFFDFB', 
        border: '1px solid #E8E2D9',
        ringColor: is_featured ? '#D4AF37' : undefined,
      }}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="secondary"
                  className="text-xs"
                  style={{ background: statusBadge.bg, color: statusBadge.color }}
                >
                  {statusBadge.label}
                </Badge>
                
                {urgencyBadge && (
                  <Badge 
                    className="text-xs gap-1"
                    style={{ background: urgencyBadge.bg, color: urgencyBadge.color }}
                  >
                    <Zap className="h-3 w-3" />
                    {urgencyBadge.label}
                  </Badge>
                )}
                
                {is_featured && (
                  <Badge 
                    className="text-xs"
                    style={{ background: '#D4AF37', color: '#1A1714' }}
                  >
                    En vedette
                  </Badge>
                )}
              </div>

              <Link href={`/projects/${id}`}>
                <h3 
                  className="font-semibold text-lg hover:underline cursor-pointer line-clamp-2"
                  style={{ color: '#1A1714', fontFamily: 'Playfair Display, serif' }}
                >
                  {title}
                </h3>
              </Link>
            </div>

            {onBookmark && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  onBookmark(id);
                }}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-5 w-5" style={{ color: '#C75B39' }} />
                ) : (
                  <Bookmark className="h-5 w-5" style={{ color: '#9A948D' }} />
                )}
              </Button>
            )}
          </div>

          {/* Description */}
          <p 
            className="mt-3 text-sm line-clamp-3"
            style={{ color: '#3D3833' }}
          >
            {description}
          </p>

          {/* Compétences */}
          {skills_required.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {skills_required.slice(0, 5).map((skill, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: '#E8E2D9', color: '#6B6560' }}
                >
                  {skill}
                </Badge>
              ))}
              {skills_required.length > 5 && (
                <Badge 
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: '#E8E2D9', color: '#9A948D' }}
                >
                  +{skills_required.length - 5}
                </Badge>
              )}
            </div>
          )}

          {/* Infos projet */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Budget */}
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" style={{ color: '#C75B39' }} />
              <div>
                <p className="text-xs" style={{ color: '#9A948D' }}>Budget</p>
                <p className="text-sm font-medium" style={{ color: '#1A1714' }}>
                  {formatBudget()}
                </p>
              </div>
            </div>

            {/* Deadline */}
            {deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" style={{ color: '#5C6B4A' }} />
                <div>
                  <p className="text-xs" style={{ color: '#9A948D' }}>Deadline</p>
                  <p className="text-sm font-medium" style={{ color: '#1A1714' }}>
                    {new Date(deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            )}

            {/* Localisation */}
            {(location_preference || preferred_city) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" style={{ color: '#9A948D' }} />
                <div>
                  <p className="text-xs" style={{ color: '#9A948D' }}>Lieu</p>
                  <p className="text-sm font-medium" style={{ color: '#1A1714' }}>
                    {preferred_city || (location_preference === 'remote' ? 'À distance' : location_preference)}
                  </p>
                </div>
              </div>
            )}

            {/* Niveau */}
            {experience_level && experience_level !== 'any' && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: '#9A948D' }} />
                <div>
                  <p className="text-xs" style={{ color: '#9A948D' }}>Niveau</p>
                  <p className="text-sm font-medium" style={{ color: '#1A1714' }}>
                    {experience_level === 'entry' ? 'Débutant' : 
                     experience_level === 'intermediate' ? 'Intermédiaire' : 'Expert'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div 
          className="px-5 py-3 flex items-center justify-between border-t"
          style={{ borderColor: '#E8E2D9', background: '#FAF7F2' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" style={{ color: '#9A948D' }} />
              <span className="text-sm" style={{ color: '#6B6560' }}>
                {proposals_count} offre{proposals_count > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" style={{ color: '#9A948D' }} />
              <span className="text-sm" style={{ color: '#6B6560' }}>
                {views_count} vue{views_count > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <span className="text-xs" style={{ color: '#9A948D' }}>
            {timeAgo}
          </span>
        </div>

        {/* Client info */}
        {showClient && client && (
          <div 
            className="px-5 py-3 flex items-center justify-between border-t"
            style={{ borderColor: '#E8E2D9' }}
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={client.avatar} />
                <AvatarFallback style={{ background: '#E8E2D9', color: '#6B6560' }}>
                  {client.name?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium" style={{ color: '#1A1714' }}>
                  {client.name || `Client #${client.id}`}
                </p>
                {client.total_projects && (
                  <p className="text-xs" style={{ color: '#9A948D' }}>
                    {client.total_projects} projet{client.total_projects > 1 ? 's' : ''} publié{client.total_projects > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            
            <Link href={`/projects/${id}`}>
              <Button 
                size="sm"
                style={{ background: '#C75B39', color: '#FFFDFB' }}
              >
                Postuler
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
