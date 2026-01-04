import React from "react";

// Composant d'icône Sparkle inspiré de l'image fournie
// Différents motifs disponibles pour varier l'apparence

interface SparkleIconProps {
  variant?: "default" | "plus" | "star" | "diamond" | "cross" | "burst";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: string;
  bgColor?: string;
  rounded?: boolean;
}

export default function SparkleIcon({
  variant = "default",
  size = "md",
  className = "",
  color = "#FFFDFB",
  bgColor = "#C75B39",
  rounded = true,
}: SparkleIconProps) {
  // Tailles en pixels
  const sizes = {
    sm: { box: 32, icon: 16 },
    md: { box: 48, icon: 24 },
    lg: { box: 64, icon: 32 },
    xl: { box: 96, icon: 48 },
  };

  const { box, icon } = sizes[size];

  // Différents motifs SVG
  const renderIcon = () => {
    switch (variant) {
      case "plus":
        // Étoile à 4 branches avec plus
        return (
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Étoile principale */}
            <path
              d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
              fill={color}
            />
            {/* Petit plus en haut à droite */}
            <path
              d="M18 4V8M16 6H20"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        );

      case "star":
        // Étoile classique
        return (
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill={color}
            />
          </svg>
        );

      case "diamond":
        // Losange avec éclats
        return (
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L22 12L12 22L2 12L12 2Z"
              fill={color}
            />
            <circle cx="18" cy="6" r="1.5" fill={color} />
            <circle cx="6" cy="6" r="1" fill={color} />
          </svg>
        );

      case "cross":
        // Croix stylisée
        return (
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 3L14 10H21L15.5 14L17.5 21L12 17L6.5 21L8.5 14L3 10H10L12 3Z"
              fill={color}
            />
          </svg>
        );

      case "burst":
        // Éclat rayonnant
        return (
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2V6M12 18V22M2 12H6M18 12H22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="4" fill={color} />
          </svg>
        );

      default:
        // Motif par défaut - Étoile à 4 branches avec petit plus (comme l'image)
        return (
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Étoile à 4 branches principale */}
            <path
              d="M12 1C12 1 13.5 7.5 14 9C14.5 10.5 17 12 17 12C17 12 14.5 13.5 14 15C13.5 16.5 12 23 12 23C12 23 10.5 16.5 10 15C9.5 13.5 7 12 7 12C7 12 9.5 10.5 10 9C10.5 7.5 12 1 12 1Z"
              fill={color}
            />
            {/* Petit plus en haut à droite */}
            <path
              d="M19 3V7M17 5H21"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        width: box,
        height: box,
        backgroundColor: bgColor,
        borderRadius: rounded ? "12px" : "0",
      }}
    >
      {renderIcon()}
    </div>
  );
}

// Composant pour afficher plusieurs icônes avec rotation aléatoire
interface SparklePatternProps {
  count?: number;
  className?: string;
}

export function SparklePattern({ count = 3, className = "" }: SparklePatternProps) {
  const variants: Array<"default" | "plus" | "star" | "diamond" | "cross" | "burst"> = [
    "default",
    "plus",
    "star",
    "diamond",
    "cross",
    "burst",
  ];

  return (
    <div className={`flex gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SparkleIcon
          key={index}
          variant={variants[index % variants.length]}
          size="md"
        />
      ))}
    </div>
  );
}

// Composant pour décoration de section
interface SectionSparkleProps {
  position?: "left" | "right" | "center";
  className?: string;
}

export function SectionSparkle({ position = "right", className = "" }: SectionSparkleProps) {
  const positionClasses = {
    left: "justify-start",
    right: "justify-end",
    center: "justify-center",
  };

  return (
    <div className={`flex ${positionClasses[position]} ${className}`}>
      <div className="flex gap-2 opacity-20">
        <SparkleIcon variant="default" size="sm" bgColor="transparent" color="#C75B39" />
        <SparkleIcon variant="plus" size="sm" bgColor="transparent" color="#C75B39" />
        <SparkleIcon variant="star" size="sm" bgColor="transparent" color="#C75B39" />
      </div>
    </div>
  );
}
