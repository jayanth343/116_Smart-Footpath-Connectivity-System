import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ArrowLeft, MapPin, Calendar, AlertTriangle, MessageSquare, Camera, X } from 'lucide-react';
import { fetchFootpathsWithIssues, updateIssueStatus } from '../services/supabaseService';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const IssueDetail = () => {
  const { id } = useParams(); // This is the fid from Supabase
  const navigate = useNavigate();
  const location = useLocation();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const openImageModal = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setShowImageModal(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return '#dc3545';
      case 'In Progress': return '#ffc107';
      case 'Closed': return '#28a745';
      default: return '#6c757d';
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateIssueStatus(issue.issue_id || issue.fid, newStatus);
      // Update the local state
      setIssue(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  useEffect(() => {
    const loadIssue = async () => {
      try {
        const footpaths = await fetchFootpathsWithIssues();
        // First try to find by issue_id, then fallback to fid for backward compatibility
        const foundIssue = footpaths.find(fp => 
          String(fp.issue_id || fp.fid) === String(id)
        );
        setIssue(foundIssue || null);
      } catch (error) {
        console.error('Error loading issue:', error);
      }
      setLoading(false);
    };
    loadIssue();
  }, [id]);

  if (loading) {
    return <div>Loading issue details...</div>;
  }

  if (!issue) {
    return <div>Issue not found</div>;
  }

  // Get priority based on score (lower score = higher priority)
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

  const priority = getPriority(issue.score);
  
  // Use coordinates from location state if available, otherwise from issue data
  const coordinates = location.state?.latitude && location.state?.longitude 
    ? [location.state.latitude, location.state.longitude]
    : [issue.latitude || 0, issue.longitude || 0];

  return (
    <div className="container">
      <button 
        onClick={() => navigate('/dashboard')}
        className="btn"
        style={{ 
          marginBottom: '2rem', 
          display: 'flex', 
          alignItems: 'center',
          backgroundColor: '#6c757d',
          color: 'white'
        }}
      >
        <ArrowLeft size={16} style={{ marginRight: '8px' }} />
        Back to Dashboard
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Main Content */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h2>Footpath ID: {issue.fid}</h2>
              <span 
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: getSeverityColor(priority),
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {priority === 'high' && <AlertTriangle size={16} style={{ marginRight: '8px' }} />}
                {priority.toUpperCase()} PRIORITY
              </span>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3>Issue Details</h3>
              <div style={{ color: '#666', lineHeight: '1.6' }}>
                <p><strong>AI Walkability Score:</strong> {issue.score ?? 'N/A'}</p>
                <p><strong>User Rating:</strong> {issue.user_rating ?? 'N/A'}/5</p>
                <p><strong>Issues Identified:</strong></p>
                {issue.authorities && issue.authorities.length > 0 ? (
                  <ul>
                    {issue.authorities.map((auth, idx) => (
                      <li key={idx}>
                        {auth.issue ?? 'N/A'} (Authority: {auth.authority_tagged ?? 'N/A'})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No specific issues reported</p>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <MapPin size={16} style={{ marginRight: '8px' }} />
                  Location
                </h4>
                <p>Start: [{issue.latitude ?? 'N/A'}, {issue.longitude ?? 'N/A'}]</p>
                <p>End: [{issue.latitude_end ?? 'N/A'}, {issue.longitude_end ?? 'N/A'}]</p>
              </div>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <Calendar size={16} style={{ marginRight: '8px' }} />
                  Last Updated
                </h4>
                <p>{issue.images && issue.images.length > 0 
                    ? new Date(issue.images[0].created_at).toLocaleDateString()
                    : 'N/A'}</p>
              </div>
            </div>

            {/* Map */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Location Map</h3>
              <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden' }}>
                <MapContainer 
                  center={coordinates} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={coordinates}>
                    <Popup>Footpath ID: {issue.fid}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>

            {/* Images */}
            {issue.images && issue.images.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <Camera size={20} style={{ marginRight: '8px' }} />
                  Footpath Photos ({issue.images.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {issue.images.map((image, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        border: '1px solid #ddd', 
                        borderRadius: '8px', 
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onClick={() => openImageModal(image)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <img 
                        src={image.image_link} 
                        alt={`Footpath ${index + 1}`}
                        style={{ 
                          width: '100%', 
                          height: '150px', 
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{ padding: '8px', fontSize: '12px', color: '#666' }}>
                        {image.created_at ? new Date(image.created_at).toLocaleString() : 'N/A'}
                        <div style={{ marginTop: '4px', fontSize: '10px', color: '#999' }}>
                          Click to view full size
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Issue Details */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3>Technical Details</h3>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Status:</strong>
                <select
                  value={issue.status || 'Open'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    color: '#333',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>AI Score:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#666' }}>{issue.score ?? 'N/A'}</p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>User Rating:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#666' }}>{issue.user_rating ?? 'N/A'}/5</p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Priority Level:</strong>
                <p style={{ margin: '4px 0 0 0', color: getSeverityColor(priority) }}>{priority.toUpperCase()}</p>
              </div>
              <div>
                <strong>Authorities Notified:</strong>
                <div style={{ margin: '4px 0 0 0', color: '#666' }}>
                  {issue.authorities && issue.authorities.length > 0 ? (
                    issue.authorities.map((auth, idx) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        {auth.authority_tagged ?? 'N/A'}
                      </div>
                    ))
                  ) : (
                    'None'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Public Comments */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <MessageSquare size={18} style={{ marginRight: '8px' }} />
              Public Comments (0)
            </h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                No public comments yet. Comments feature will be available in future updates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeImageModal}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001
              }}
            >
              <X size={20} />
            </button>
            <img 
              src={selectedImage.image_link}
              alt="Full size footpath image"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#f8f9fa',
              borderTop: '1px solid #dee2e6'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                <strong>Captured:</strong> {selectedImage.created_at ? new Date(selectedImage.created_at).toLocaleString() : 'N/A'}
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                Click anywhere outside the image or the X button to close
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetail;
