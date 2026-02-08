/**
 * StatCard Component
 * Reusable card for displaying task statistics with click functionality
 */
import GlassCard from '../../app/components/GlassCard';

export default function StatCard({ 
  title, 
  value, 
  textColor = 'text-gray-800', 
  onClick, 
  isActive = false, 
  tooltip = null 
}) {
  const activeClasses = isActive ? 'ring-2 ring-indigo-500/50 shadow-lg' : '';
  
  return (
    <GlassCard 
      variant={isActive ? "strong" : "default"}
      padding="none"
      className={`text-center cursor-pointer hover:scale-105 transform transition-all duration-300 ${activeClasses} relative group p-3 sm:p-5`}
      onClick={onClick}
      hover
    >
      <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase truncate">
        {title}
      </h3>
      <p className={`text-lg sm:text-2xl font-bold ${textColor} mt-1`}>
        {value}
      </p>
      {isActive && (
        <div className="mt-2">
          <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full"></span>
        </div>
      )}
      {tooltip && (
        <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </GlassCard>
  );
}
