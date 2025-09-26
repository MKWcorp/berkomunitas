'use client';

export default function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1 mb-6">
      <nav className="flex space-x-1" aria-label="Tabs">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => onTabChange(tabItem.key)}
            className={`flex-1 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 ${
              activeTab === tabItem.key
                ? 'bg-white/40 text-blue-600 shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
            }`}
          >
            <span className="block truncate">
              {tabItem.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
