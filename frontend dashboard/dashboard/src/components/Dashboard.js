import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { fetchFootpathsWithIssues, fetchDashboardStats } from '../services/supabaseService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [footpaths, setFootpaths] = useState([]);
  const [stats, setStats] = useState({
    totalFootpaths: 0,
    totalIssues: 0,
    avgScore: 'N/A',
    avgRating: 'N/A'
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [footpathsData, statsData] = await Promise.all([
          fetchFootpathsWithIssues(),
          fetchDashboardStats()
        ]);
        setFootpaths(footpathsData);
        setStats(statsData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Score mapping: lower score = higher priority
  const getPriority = (score) => {
    if (score === null || score === undefined) return 'unknown';
    if (score < 30) return 'high';
    if (score < 60) return 'medium';
    return 'low';
  };

  const getSeverityColor = (priority) => {
    switch(priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return '#dc3545';
      case 'In Progress': return '#ffc107';
      case 'Closed': return '#28a745';
      default: return '#6c757d';
    }
  };

  // Filtering based on priority and status
  const filteredIssues = footpaths.filter(issue => {
    const priorityMatch = filter === 'all' || getPriority(issue.score) === filter;
    const statusMatch = statusFilter === 'all' || (issue.status || 'Open') === statusFilter;
    return priorityMatch && statusMatch;
  });

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Notifications Panel */}
        <div>
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <Bell size={20} style={{ marginRight: '10px' }} />
              Recent Notifications
            </h3>
            <div>
              <div style={{ 
                padding: '10px', 
                borderLeft: '4px solid #dc3545', 
                marginBottom: '10px',
                backgroundColor: '#f8f9fa'
              }}>
                <strong>High Priority Issue</strong>
                <p>New critical footpath damage reported on Main Street</p>
                <small style={{ color: '#666' }}>2 hours ago</small>
              </div>
              <div style={{ 
                padding: '10px', 
                borderLeft: '4px solid #ffc107', 
                marginBottom: '10px',
                backgroundColor: '#f8f9fa'
              }}>
                <strong>Medium Priority Issue</strong>
                <p>Multiple reports of uneven surface on Park Avenue</p>
                <small style={{ color: '#666' }}>5 hours ago</small>
              </div>
              <div style={{ 
                padding: '10px', 
                borderLeft: '4px solid #17a2b8', 
                backgroundColor: '#f8f9fa'
              }}>
                <strong>System Update</strong>
                <p>Weekly maintenance report is now available</p>
                <small style={{ color: '#666' }}>1 day ago</small>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="card">
            <h3>Issue Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4 style={{ color: '#dc3545' }}>
                  {footpaths.filter(fp => getPriority(fp.score) === 'high').length}
                </h4>
                <p>High Priority</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4 style={{ color: '#ffc107' }}>
                  {footpaths.filter(fp => getPriority(fp.score) === 'medium').length}
                </h4>
                <p>Medium Priority</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4 style={{ color: '#28a745' }}>
                  {footpaths.filter(fp => getPriority(fp.score) === 'low').length}
                </h4>
                <p>Low Priority</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4 style={{ color: '#17a2b8' }}>{footpaths.length}</h4>
                <p>Total Issues</p>
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Footpath Issues</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="all">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredIssues.length === 0 && <div>No footpaths found.</div>}
              {filteredIssues.map(issue => (
                <div 
                  key={issue.issue_id || issue.fid}
                  style={{
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s'
                  }}
                  onClick={() => navigate(`/issue/${issue.issue_id || issue.fid}`, { state: { latitude: issue.latitude, longitude: issue.longitude } })}
                  onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ marginBottom: '0.5rem' }}>Footpath ID: {issue.fid}</h4>
                      <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                        {issue.authorities.length > 0
                          ? issue.authorities.map((auth, idx) =>
                              <span key={idx}>
                                <strong>{auth.issue ? auth.issue : 'No Issue'}</strong>
                                {auth.authority_tagged ? ` (Authority: ${auth.authority_tagged})` : ''}
                                {idx < issue.authorities.length - 1 ? ', ' : ''}
                              </span>
                            )
                          : 'No authority/issue tagged'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          <MapPin size={14} style={{ marginRight: '4px' }} />
                          [{issue.latitude}, {issue.longitude}]
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          <Clock size={14} style={{ marginRight: '4px' }} />
                          {issue.images && issue.images.length > 0
                            ? new Date(issue.images[0].created_at).toLocaleString()
                            : 'No timestamp'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>Status:</span>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: '#f8f9fa',
                          color: '#333',
                          border: '1px solid #ddd'
                        }}>
                          {issue.status || 'Open'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span 
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'white',
                          backgroundColor: getSeverityColor(getPriority(issue.score))
                        }}
                      >
                        {getPriority(issue.score).toUpperCase()}
                      </span>
                      {getPriority(issue.score) === 'high' && (
                        <AlertTriangle size={20} style={{ color: '#dc3545' }} />
                      )}
                    </div>
                  </div>
                  {/* Images */}
                  {issue.images && issue.images.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Images:</strong>
                      <ul>
                        {issue.images.map((img, idx) => (
                          <li key={idx}>
                            <a href={img.image_link} target="_blank" rel="noopener noreferrer">
                              View Image
                            </a>{' '}
                            <span style={{ color: '#888' }}>
                              ({new Date(img.created_at).toLocaleString()})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
