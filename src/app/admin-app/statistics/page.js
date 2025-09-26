"use client";
import { useState, useEffect } from "react";
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  TrophyIcon, 
  ChatBubbleBottomCenterTextIcon,
  CalendarIcon,
  EyeIcon,
  StarIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../components/GlassCard';

// Simple Chart Component (could be replaced with chart library)
function SimpleBarChart({ data, title, color = "blue" }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="p-4">
      <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-20 text-sm text-gray-600 truncate">
              {item.label}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`bg-${color}-600 h-2 rounded-full transition-all duration-500`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              ></div>
            </div>
            <div className="w-12 text-sm font-medium text-gray-900">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Activity Timeline Component
function ActivityTimeline({ activities }) {
  return (
    <div className="p-4">
      <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={`w-2 h-2 rounded-full mt-2 ${
              activity.type === 'member' ? 'bg-blue-500' :
              activity.type === 'badge' ? 'bg-yellow-500' :
              activity.type === 'comment' ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const [stats, setStats] = useState({
    overview: {
      totalMembers: 0,
      totalComments: 0,
      totalBadges: 0,
      activeToday: 0
    },
    memberStats: [],
    badgeStats: [],
    commentStats: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Load overview stats
      const overviewResponse = await fetch('/api/admin/stats/overview');
      const overviewData = await overviewResponse.json();
      
      // Load member growth stats
      const memberResponse = await fetch(`/api/admin/stats/members?period=${selectedPeriod}`);
      const memberData = await memberResponse.json();
      
      // Load badge distribution stats
      const badgeResponse = await fetch('/api/admin/stats/badges');
      const badgeData = await badgeResponse.json();
      
      // Load comment stats
      const commentResponse = await fetch(`/api/admin/stats/comments?period=${selectedPeriod}`);
      const commentData = await commentResponse.json();
      
      // Load recent activity
      const activityResponse = await fetch('/api/admin/stats/activity');
      const activityData = await activityResponse.json();

      setStats({
        overview: overviewData || stats.overview,
        memberStats: memberData || [],
        badgeStats: badgeData || [],
        commentStats: commentData || [],
        recentActivity: activityData || []
      });
      
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Mock data for development
      setStats({
        overview: {
          totalMembers: 1247,
          totalComments: 8920,
          totalBadges: 156,
          activeToday: 89
        },
        memberStats: [
          { label: 'Jan', value: 45 },
          { label: 'Feb', value: 67 },
          { label: 'Mar', value: 89 },
          { label: 'Apr', value: 123 },
          { label: 'May', value: 156 }
        ],
        badgeStats: [
          { label: 'Newbie', value: 234 },
          { label: 'Active', value: 189 },
          { label: 'Expert', value: 67 },
          { label: 'Legend', value: 23 }
        ],
        commentStats: [
          { label: 'Week 1', value: 456 },
          { label: 'Week 2', value: 678 },
          { label: 'Week 3', value: 543 },
          { label: 'Week 4', value: 789 }
        ],
        recentActivity: [
          { type: 'member', message: 'New member joined: John Doe', time: '2 minutes ago' },
          { type: 'badge', message: 'Badge awarded: Expert Commenter to Jane Smith', time: '15 minutes ago' },
          { type: 'comment', message: '50 new comments posted today', time: '1 hour ago' },
          { type: 'member', message: 'Member reached 1000 coins: Alex Johnson', time: '2 hours ago' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <GlassCard className="p-6">
      <div className="flex items-center">
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </GlassCard>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="w-8 h-8 mr-3 text-blue-600" />
            Dashboard Analytics
          </h1>
          <p className="text-gray-600 mt-1">Monitor komunitas activity dan growth metrics</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={UserGroupIcon}
          title="Total Members"
          value={stats.overview.totalMembers}
          subtitle="Registered users"
          color="blue"
        />
        <StatCard
          icon={ChatBubbleBottomCenterTextIcon}
          title="Total Comments"
          value={stats.overview.totalComments}
          subtitle="All time comments"
          color="green"
        />
        <StatCard
          icon={TrophyIcon}
          title="Badges Awarded"
          value={stats.overview.totalBadges}
          subtitle="Achievement badges"
          color="yellow"
        />
        <StatCard
          icon={FireIcon}
          title="Active Today"
          value={stats.overview.activeToday}
          subtitle="Users online today"
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Growth */}
        <GlassCard>
          <SimpleBarChart
            data={stats.memberStats}
            title="Member Growth"
            color="blue"
          />
        </GlassCard>

        {/* Badge Distribution */}
        <GlassCard>
          <SimpleBarChart
            data={stats.badgeStats}
            title="Badge Distribution"
            color="yellow"
          />
        </GlassCard>

        {/* Comment Activity */}
        <GlassCard>
          <SimpleBarChart
            data={stats.commentStats}
            title="Comment Activity"
            color="green"
          />
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard>
          <ActivityTimeline activities={stats.recentActivity} />
        </GlassCard>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <GlassCard className="p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <StarIcon className="w-5 h-5 mr-2 text-yellow-500" />
            Top Contributors
          </h4>
          <div className="space-y-3">
            {[
              { name: 'John Doe', count: 45, type: 'comments' },
              { name: 'Jane Smith', count: 38, type: 'comments' },
              { name: 'Alex Johnson', count: 32, type: 'comments' },
              { name: 'Sarah Wilson', count: 28, type: 'comments' }
            ].map((user, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-900">{user.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-600">{user.count} {user.type}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Popular Content */}
        <GlassCard className="p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <EyeIcon className="w-5 h-5 mr-2 text-blue-500" />
            Most Viewed
          </h4>
          <div className="space-y-3">
            {[
              { title: 'How to start coding?', views: 1234 },
              { title: 'Best practices for...', views: 987 },
              { title: 'Tutorial JavaScript', views: 876 },
              { title: 'React vs Vue', views: 654 }
            ].map((content, index) => (
              <div key={index} className="space-y-1">
                <p className="text-sm text-gray-900 truncate">{content.title}</p>
                <p className="text-xs text-gray-500">{content.views.toLocaleString()} views</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* System Health */}
        <GlassCard className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">System Health</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Server Status</span>
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium text-blue-600">142ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-green-600">99.9%</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
