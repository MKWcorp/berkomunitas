// Create a simple SVG hero illustration to replace missing PNG
export default function HeroIllustration({ className, width = 60, height = 60 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Community/Chat bubble illustration */}
      <circle cx="30" cy="30" r="28" fill="white" fillOpacity="0.9" />
      
      {/* Chat bubbles */}
      <ellipse cx="20" cy="22" rx="8" ry="6" fill="#3B82F6" fillOpacity="0.2" />
      <ellipse cx="40" cy="26" rx="7" ry="5" fill="#8B5CF6" fillOpacity="0.2" />
      <ellipse cx="30" cy="38" rx="9" ry="6" fill="#EF4444" fillOpacity="0.2" />
      
      {/* People icons */}
      <circle cx="16" cy="18" r="2" fill="#3B82F6" />
      <circle cx="24" cy="20" r="2" fill="#3B82F6" />
      
      <circle cx="36" cy="22" r="2" fill="#8B5CF6" />
      <circle cx="44" cy="24" r="2" fill="#8B5CF6" />
      
      <circle cx="26" cy="34" r="2" fill="#EF4444" />
      <circle cx="34" cy="36" r="2" fill="#EF4444" />
      
      {/* Connection lines */}
      <line x1="20" y1="25" x2="30" y2="32" stroke="#94A3B8" strokeWidth="1" opacity="0.5" />
      <line x1="40" y1="30" x2="35" y2="35" stroke="#94A3B8" strokeWidth="1" opacity="0.5" />
      
      {/* Central icon - community symbol */}
      <circle cx="30" cy="30" r="4" fill="white" stroke="#6366F1" strokeWidth="2" />
      <circle cx="30" cy="30" r="1.5" fill="#6366F1" />
    </svg>
  );
}
