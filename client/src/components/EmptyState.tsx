import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: '#E8E2D9' }}
      >
        <Icon className="h-10 w-10" style={{ color: '#9A948D' }} />
      </div>
      
      <h3 
        className="text-xl font-semibold mb-2"
        style={{ fontFamily: 'Playfair Display, serif', color: '#1A1714' }}
      >
        {title}
      </h3>
      
      <p 
        className="max-w-md mb-6"
        style={{ color: '#6B6560' }}
      >
        {description}
      </p>
      
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Link href={actionHref}>
            <Button 
              className="rounded-sm"
              style={{ background: '#C75B39', color: '#FFFDFB' }}
            >
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button 
            onClick={onAction}
            className="rounded-sm"
            style={{ background: '#C75B39', color: '#FFFDFB' }}
          >
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
