import React, { useEffect, useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';

const Accounts = () => {
  const { token, userName } = useContext(ShopContext);
  const [customersData, setCustomersData] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionRetries, setConnectionRetries] = useState(0);

  // Sample fallback data in case the server is down
  const fallbackData = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      orders: 5,
      accountCreated: '01/15/2024'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      orders: 2,
      accountCreated: '03/22/2024'
    },
    {
      id: '3',
      name: 'Michael Johnson',
      email: 'michael.j@example.com',
      orders: 8,
      accountCreated: '11/05/2023'
    }
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check for authentication token
        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          // Use fallback data for demo purposes
          setCustomersData(fallbackData);
          return;
        }

        // Make API call with authentication token and timeout
        const response = await axios.get('http://localhost:8080/api/users/all', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000 // 5 second timeout to prevent long waits
        });

        console.log('Fetched users:', response.data);

        // Check if the response data is in the expected format
        const users = response.data.users || response.data;
        if (!users || !Array.isArray(users)) {
          throw new Error('Invalid response format from server');
        }

        // Format the data to match your table structure with better error handling
        const formattedUsers = users.map(user => ({
          id: user._id || user.id || 'N/A',
          name: user.fullName || user.username || 'Not provided',
          email: user.e_Mail || user.email || 'Not provided',
          orders: user.Orders?.length || user.orders || 0,
          accountCreated: user.created_at ? 
            new Date(user.created_at).toLocaleDateString() : 
            (user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A')
        }));

        setCustomersData(formattedUsers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        
        // Better error handling with specific messages
        if (err.code === 'ECONNABORTED') {
          setError('Request timed out. Server may be slow to respond.');
        } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
          setError('Cannot connect to server. Using demo data instead.');
          // Use fallback data after connection failure
          setCustomersData(fallbackData);
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch users. Using demo data.');
          // Use fallback data for any other error
          setCustomersData(fallbackData);
        }
        
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const filterAndRender = () => {
    return customersData.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        c.email.toLowerCase().includes(searchInput.toLowerCase());

      const isPending = c.orders < 3;
      const isCompleted = c.orders >= 3;

      return matchesSearch && (
        orderFilter === 'all' ||
        (orderFilter === 'pending' && isPending) ||
        (orderFilter === 'completed' && isCompleted)
      );
    });
  };

  const handleRetryConnection = () => {
    setConnectionRetries(prev => prev + 1);
    setLoading(true);
    window.location.reload();
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, backgroundColor: '#fff5f8' }}>
      <div className="container" style={styles.container}>
        <h2 style={{ color: '#d63384', marginBottom: 10 }}>CUSTOMER LIST</h2>
        
        {/* Enhanced error message with retry button */}
        {error && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: error.includes('demo data') ? '#fff3cd' : '#ffdddd', 
            color: error.includes('demo data') ? '#856404' : '#d63384', 
            marginBottom: '20px', 
            borderRadius: '5px',
            border: error.includes('demo data') ? '1px solid #ffeeba' : '1px solid #f5c6cb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              {error.includes('demo') ? '⚠️ ' : '❌ '} 
              {error}
            </div>
            {error.includes('Cannot connect') && (
              <button 
                onClick={handleRetryConnection} 
                style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#d63384', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px', 
                  cursor: 'pointer',
                  marginLeft: '10px'
                }}
              >
                Retry Connection
              </button>
            )}
          </div>
        )}
        
        <div style={styles.searchWrapper}>
          <img src={assets.SearchLOGO} alt="Search Icon" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search customer..."
            style={styles.searchInput}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <select
            style={styles.filterSelect}
            value={orderFilter}
            onChange={e => setOrderFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending Orders</option>
            <option value="completed">Completed Orders</option>
          </select>
        </div>
  
        {/* Show loading indicator */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              display: 'inline-block',
              width: '30px',
              height: '30px',
              border: '4px solid rgba(214, 51, 132, 0.3)',
              borderRadius: '50%',
              borderTop: '4px solid #d63384',
              animation: 'spin 1s linear infinite',
              marginBottom: '10px'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <p>Loading customers...</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Orders</th>
                <th style={styles.th}>Account Created</th>
              </tr>
            </thead>
            <tbody>
              {filterAndRender().length > 0 ? (
                filterAndRender().map((c, i) => (
                  <tr key={i} style={i % 2 === 0 ? {} : { backgroundColor: '#f9f9f9' }}>
                    <td style={styles.td}>{c.name}</td>
                    <td style={styles.td}>{c.email}</td>
                    <td style={styles.td}>{c.orders}</td>
                    <td style={styles.td}>{c.accountCreated}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                    No customers found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
  
      <footer style={styles.footer}>
        <div style={styles.footerGradient}></div>
      </footer>
    </div>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 40px',
    backgroundColor: '#d63384',
    color: 'white',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logoImg: {
    width: 35,
    height: 35,
    borderRadius: '50%',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  logoChef: {
    fontSize: 27,
    fontFamily: '"Cream Cake", cursive',
    fontWeight: 400,
    color: '#FFF',
    lineHeight: 'normal',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginLeft: 40,
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 14,
    fontFamily: 'Montserrat, sans-serif',
  },
  userIcon: {
    width: 24,
    height: 24,
    cursor: 'pointer',
  },
  container: {
    margin: '40px auto',
    maxWidth: 900,
    background: 'white',
    padding: 30,
    border: '1px solid #ccc',
    borderRadius: 10,
    position: 'relative',
    zIndex: 1,
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchIcon: {
    position: 'absolute',
    left: 10,
    width: 20,
    height: 20,
  },
  searchInput: {
    flex: 1,
    padding: '10px 10px 10px 40px',
    border: '1px solid #ccc',
    borderRadius: 5,
    fontSize: 14,
  },
  filterSelect: {
    marginLeft: 10,
    padding: 10,
    fontSize: 14,
    borderRadius: 5,
    border: '1px solid #ccc',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    backgroundColor: '#fff',
  },
  th: {
    textAlign: 'left',
    padding: 12,
    borderBottom: '1px solid #ddd',
    backgroundColor: '#f8f8f8',
  },
  td: {
    textAlign: 'left',
    padding: 12,
    borderBottom: '1px solid #ddd',
  },
};

export default Accounts;
