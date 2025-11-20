import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const showHeader = location.pathname !== '/login';

  if (!showHeader) return null;

  return (
    <header style={{
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '1rem 0',
      marginBottom: '2rem'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1>Footpath Monitoring Dashboard</h1>
        <nav>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/home')}
            style={{ marginRight: '10px' }}
          >
            Home
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/dashboard')}
            style={{ marginRight: '10px' }}
          >
            Issues
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/chatbot')}
            style={{ marginRight: '10px' }}
          >
            AI Assistant
          </button>
          <button 
            className="btn"
            onClick={() => navigate('/login')}
            style={{ backgroundColor: '#e74c3c', color: 'white' }}
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
