import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  MapPin, 
  Calendar,
  DollarSign,
  Award,
  Bell,
  Bot
} from 'lucide-react';
import { fetchDashboardStats, fetchFootpathsWithIssues } from '../services/supabaseService';

const HomePage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFootpaths: 0,
    totalIssues: 0,
    avgScore: 'N/A',
    avgRating: 'N/A'
  });
  const [footpaths, setFootpaths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, footpathsData] = await Promise.all([
          fetchDashboardStats(),
          fetchFootpathsWithIssues()
        ]);
        setStats(statsData);
        setFootpaths(footpathsData);
      } catch (error) {
        console.error('Error loading homepage data:', error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Calculate priority-based stats
  const getPriority = (score) => {
    if (score === null || score === undefined) return 'unknown';
    if (score < 30) return 'high';
    if (score < 60) return 'medium';
    return 'low';
  };

  const highPriorityCount = footpaths.filter(fp => getPriority(fp.score) === 'high').length;
  const mediumPriorityCount = footpaths.filter(fp => getPriority(fp.score) === 'medium').length;
  const lowPriorityCount = footpaths.filter(fp => getPriority(fp.score) === 'low').length;

  const widgets = [
    {
      title: "Issue Dashboard",
      icon: <AlertTriangle size={24} />,
      description: "View and manage all footpath issues",
      stats: loading ? "Loading..." : `${footpaths.length} Active Issues`,
      color: "#e74c3c",
      action: () => navigate('/dashboard')
    },
    {
      title: "AI Assistant",
      icon: <Bot size={24} />,
      description: "Get help with queries and analysis",
      stats: "24/7 Available",
      color: "#6c5ce7",
      action: () => navigate('/chatbot')
    },
    {
      title: "High Priority Issues",
      icon: <CheckCircle size={24} />,
      description: "Critical footpath issues requiring immediate attention",
      stats: loading ? "Loading..." : `${highPriorityCount} High Priority`,
      color: "#27ae60",
      action: () => navigate('/dashboard')
    },
    {
      title: "Medium Priority Issues",
      icon: <Clock size={24} />,
      description: "Issues currently being addressed",
      stats: loading ? "Loading..." : `${mediumPriorityCount} Medium Priority`,
      color: "#f39c12",
      action: () => navigate('/dashboard')
    },
    {
      title: "Work Log",
      icon: <FileText size={24} />,
      description: "Complete history of maintenance work",
      stats: `${stats.totalFootpaths || 0} Footpaths Monitored`,
      color: "#3498db",
      action: () => console.log('Navigate to work log')
    },
    {
      title: "Public Grievances",
      icon: <MessageSquare size={24} />,
      description: "Citizen complaints and feedback",
      stats: "Feature Coming Soon",
      color: "#9b59b6",
      action: () => console.log('Navigate to grievances')
    },
    {
      title: "External Contractors",
      icon: <Users size={24} />,
      description: "Third-party repair offers & bids",
      stats: "Feature Coming Soon",
      color: "#1abc9c",
      action: () => console.log('Navigate to contractors')
    },
    {
      title: "Performance Analytics",
      icon: <TrendingUp size={24} />,
      description: "Resolution time & efficiency metrics",
      stats: loading ? "Loading..." : `Avg Score: ${stats.avgScore}`,
      color: "#34495e",
      action: () => console.log('Navigate to analytics')
    },
    {
      title: "Hotspot Mapping",
      icon: <MapPin size={24} />,
      description: "Areas with frequent issues",
      stats: loading ? "Loading..." : `${lowPriorityCount} Low Priority Areas`,
      color: "#e67e22",
      action: () => console.log('Navigate to hotspot map')
    },
    {
      title: "Budget Tracking",
      icon: <DollarSign size={24} />,
      description: "Expenditure on repairs & maintenance",
      stats: "Feature Coming Soon",
      color: "#2ecc71",
      action: () => console.log('Navigate to budget')
    },
    {
      title: "Quality Assurance",
      icon: <Award size={24} />,
      description: "Post-repair quality checks",
      stats: loading ? "Loading..." : `${stats.avgRating}/5 Avg Rating`,
      color: "#8e44ad",
      action: () => console.log('Navigate to QA')
    }
  ];

  const recentActivities = [
    {
      type: "issue_resolved",
      message: "High priority crack on Main Street resolved",
      time: "2 hours ago",
      icon: <CheckCircle size={16} style={{ color: "#27ae60" }} />
    },
    {
      type: "new_grievance",
      message: "New accessibility complaint filed",
      time: "4 hours ago",
      icon: <MessageSquare size={16} style={{ color: "#9b59b6" }} />
    },
    {
      type: "contractor_bid",
      message: "External contractor submitted repair proposal",
      time: "6 hours ago",
      icon: <Users size={16} style={{ color: "#1abc9c" }} />
    },
    {
      type: "quality_check",
      message: "Quality inspection completed for Park Avenue",
      time: "1 day ago",
      icon: <Award size={16} style={{ color: "#8e44ad" }} />
    }
  ];

  return (
    <div className="container">
      {/* Welcome Section */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem', color: 'white' }}>Welcome, Municipal Authority</h2>
            <p style={{ opacity: 0.9 }}>Manage and monitor footpath conditions across the city</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <Calendar size={16} style={{ marginRight: '8px' }} />
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Bell size={16} style={{ marginRight: '8px' }} />
              3 New Alerts
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>
        {/* Widgets Grid */}
        <div>
          <h3 style={{ marginBottom: '1.5rem' }}>Dashboard Widgets</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {widgets.map((widget, index) => (
              <div
                key={index}
                className="card"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid #eee',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={widget.action}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  backgroundColor: widget.color
                }}></div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{
                    backgroundColor: widget.color,
                    color: 'white',
                    padding: '8px',
                    borderRadius: '8px',
                    marginRight: '12px'
                  }}>
                    {widget.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: '0.5rem', color: '#2c3e50' }}>{widget.title}</h4>
                    <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.4' }}>
                      {widget.description}
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '8px 12px', 
                  borderRadius: '6px',
                  border: '1px solid #e9ecef'
                }}>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: widget.color,
                    fontSize: '14px'
                  }}>
                    {widget.stats}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Quick Stats */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Quick Stats</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Total Footpaths</span>
                <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                  {loading ? 'Loading...' : stats.totalFootpaths || 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Total Issues</span>
                <span style={{ fontWeight: 'bold', color: '#3498db' }}>
                  {loading ? 'Loading...' : footpaths.length || 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Avg. AI Score</span>
                <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                  {loading ? 'Loading...' : stats.avgScore || 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Avg. User Rating</span>
                <span style={{ fontWeight: 'bold', color: '#9b59b6' }}>
                  {loading ? 'Loading...' : `${stats.avgRating || 'N/A'}/5`}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h4 style={{ marginBottom: '1rem' }}>Recent Activity</h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recentActivities.map((activity, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '12px 0',
                  borderBottom: index < recentActivities.length - 1 ? '1px solid #eee' : 'none'
                }}>
                  <div style={{ marginRight: '12px', marginTop: '2px' }}>
                    {activity.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', marginBottom: '4px', lineHeight: '1.4' }}>
                      {activity.message}
                    </p>
                    <small style={{ color: '#666' }}>{activity.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
