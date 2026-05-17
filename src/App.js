import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { validateTruck } from './validators';
import logoImage from './FleetGuardLogo.png'; 
import './App.css'; 
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Auth from './Auth'; // <-- NEW: Import the Auth component

const emptyForm = { 
  licensePlate: '', brand: '', model: '', year: '', purchaseDate: '',
  rcaStartDate: '', rcaExpiry: '', itpStartDate: '', itpExpiry: '', rovinietaStartDate: '', rovinietaExpiry: '' 
};

// This is the URL of your new Express Backend!
const API_URL = 'https://fleet-guard-api.onrender.com/api/trucks';

function App() {
  const [theme, setTheme] = useState(Cookies.get('userTheme') || 'light');
  const [lastActivity, setLastActivity] = useState(Cookies.get('lastActivity') || 'Nicio activitate recentă');
  
  const [view, setView] = useState('presentation'); // Default view after login
  const [trucks, setTrucks] = useState([]); 
  const [selectedTruck, setSelectedTruck] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);

  // --- NEW: Authentication State ---
  const [token, setToken] = useState(null);

  // Check for existing session on load
  // Check for existing session on load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchTrucks(savedToken); 
    }
  }, []);

  // --- NEW: INACTIVITY LOGOUT TIMER ---
  useEffect(() => {
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      // Set timer for 15 minutes (900,000 milliseconds)
      // Change this to 10000 (10 seconds) if you want to test it quickly!
      inactivityTimer = setTimeout(() => {
        if (localStorage.getItem('token')) {
          alert('You have been logged out due to inactivity.');
          handleLogout();
        }
      }, 900000); 
    };

    // Listen for any user activity to reset the timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    // Start the timer when the component loads
    resetTimer();

    // Cleanup listeners if the app closes
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, []); // Empty dependency array means this runs once on load

  // --- UPDATED: Fetch data from the Backend WITH Authorization Header ---
  const fetchTrucks = async (authToken = token) => {
    if (!authToken) return; // Don't fetch if not logged in
    
    try {
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${authToken}` // Sending the digital ID card
        }
      });
      const data = await response.json();
      setTrucks(data.data || []); 
    } catch (error) {
      console.error("Error fetching data from API:", error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    Cookies.set('userTheme', newTheme, { expires: 365 }); 
    logActivity(`A schimbat tema în modul ${newTheme}`);
  };

  const logActivity = (activityMsg) => {
    setLastActivity(activityMsg);
    Cookies.set('lastActivity', activityMsg, { expires: 7 }); 
  };

  const navigateTo = (newView, truck = null) => {
    setView(newView);
    if (truck) setSelectedTruck(truck);
    if (newView === 'presentation') logActivity('A accesat prezentarea generală');
    if (newView === 'master') logActivity('A navigat către lista Master');
    if (newView === 'detail' && truck) logActivity(`A vizualizat detaliile camionului ${truck.licensePlate}`);
  };

  // --- NEW: Secure Logout Function ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    logActivity('Utilizatorul s-a delogat');
  };

  const handleSaveTruck = async (e) => {
    e.preventDefault();
    const validationErrors = validateTruck(formData);
    
    if (Object.keys(validationErrors).length === 0) {
      try {
        const url = editId ? `${API_URL}/${editId}` : API_URL;
        const method = editId ? 'PUT' : 'POST';

        await fetch(url, {
          method: method,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Protect the save route
          },
          body: JSON.stringify(formData)
        });
        
        logActivity(editId ? `A modificat datele camionului ${formData.licensePlate}` : `A adăugat camionul ${formData.licensePlate} în flotă`);
        
        await fetchTrucks();
        
        setEditId(null);
        setFormData(emptyForm);
        setErrors({});
      } catch (error) {
        console.error("Error saving truck:", error);
      }
    } else {
      setErrors(validationErrors);
    }
  };

  const handleDelete = async (id) => {
    const truckToDelete = trucks.find(t => t.id === id);
    try {
      await fetch(`${API_URL}/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` } // Protect delete route
      });
      setTrucks(trucks.filter(t => t.id !== id));
      logActivity(`A șters camionul ${truckToDelete.licensePlate} din flotă`);
    } catch (error) {
      console.error("Error deleting truck:", error);
    }
  };

  const handleEditClick = (truck) => {
    setFormData(truck);
    setEditId(truck.id);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTrucks = trucks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(trucks.length / itemsPerPage);

  const chartData = trucks.reduce((acc, truck) => {
    const existingBrand = acc.find(item => item.name === truck.brand);
    if (existingBrand) existingBrand.camioane += 1;
    else acc.push({ name: truck.brand, camioane: 1 });
    return acc;
  }, []);

  // === STILURI CSS INLINE & PALETĂ MODERNĂ ===
  const bgColor = theme === 'dark' ? '#0f172a' : '#f1f5f9'; 
  const cardBgColor = theme === 'dark' ? '#1e293b' : '#ffffff'; 
  const textColor = theme === 'dark' ? '#f8fafc' : '#1e293b';
  const borderColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  
  const shadowStyle = theme === 'dark' 
    ? '0 10px 30px rgba(0,0,0,0.5)' 
    : '0 10px 30px rgba(148, 163, 184, 0.15)';

  const inputStyle = { padding: '12px', margin: '5px 0', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: `1px solid ${borderColor}`, color: textColor, backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc' };
  const btnStyle = { padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' };

  const logoStyle = {
    maxWidth: '280px', height: 'auto', marginBottom: '30px', backgroundColor: '#ffffff',
    padding: '20px', borderRadius: '16px', boxShadow: shadowStyle
  };

  const cardStyle = {
    backgroundColor: cardBgColor, padding: '25px', borderRadius: '16px', 
    marginBottom: '20px', border: `1px solid ${borderColor}`, boxShadow: shadowStyle
  };

  // --- NEW: Check if token exists, if not, render Auth screen ---
  if (!token) {
    return (
      <div style={{ backgroundColor: bgColor, color: textColor, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Auth onLogin={(newToken) => {
          setToken(newToken);
          fetchTrucks(newToken);
          logActivity('S-a logat utilizatorul securizat');
        }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: bgColor, color: textColor, minHeight: '100vh', transition: 'background-color 0.3s, color 0.3s' }}>
      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* BARĂ COOKIES & LOGOUT */}
        <div className="fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: cardBgColor, padding: '15px 25px', borderRadius: '12px', marginBottom: '30px', border: `1px solid ${borderColor}`, boxShadow: shadowStyle }}>
          <span style={{ fontSize: '0.95rem', color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>🕒 <strong style={{color: textColor}}>Ultima activitate:</strong> {lastActivity}</span>
          <div>
            <button onClick={toggleTheme} style={{ ...btnStyle, backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb', color: 'white', padding: '10px 15px', marginRight: '10px' }}>
              {theme === 'dark' ? '☀️ Luminos' : '🌙 Întunecat'}
            </button>
            <button onClick={handleLogout} style={{ ...btnStyle, backgroundColor: '#ef4444', color: 'white', padding: '10px 15px' }}>
              Deconectare
            </button>
          </div>
        </div>

        {/* 2. PAGINA DE PREZENTARE */}
        {view === 'presentation' && (
          <div className="fade-in" style={{ textAlign: 'center', marginTop: '8vh' }}>
            <img src={logoImage} alt="Fleet Guard Logo" style={logoStyle} />
            <h1 style={{ color: textColor, marginTop: '0', fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-1px' }}>Gestionare inteligentă pentru flote TIR</h1>
            <p style={{ fontSize: '1.2rem', color: theme === 'dark' ? '#94a3b8' : '#64748b', maxWidth: '600px', margin: '20px auto', lineHeight: '1.6' }}>
               O aplicație esențială care monitorizează documentele vehiculelor din flota ta. Fii mereu cu un pas înaintea expirărilor.
            </p>
            <button onClick={() => navigateTo('master')} style={{ ...btnStyle, fontSize: '1.1rem', padding: '15px 40px', backgroundColor: '#2563eb', color: 'white', marginTop: '30px', boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)' }}>
              Deschide Dashboard
            </button>
          </div>
        )}

        {/* 3. PAGINA MASTER (Side-by-Side) */}
        {(view === 'master' || view === 'detail') && (
          <div className="fade-in">
            <button onClick={() => navigateTo('presentation')} style={{ ...btnStyle, backgroundColor: 'transparent', color: theme === 'dark' ? '#94a3b8' : '#64748b', border: `1px solid ${borderColor}`, marginBottom: '25px' }}>
              ← Înapoi la Prezentare
            </button>
            
            <div className="responsive-grid">
              
              {/* COLOANA STÂNGA */}
              <div className="grid-item">
                <div style={cardStyle}>
                  <h3 style={{marginTop: 0, color: textColor}}>{editId ? "✏️ Modifică Date" : "➕ Adaugă Camion Nou"}</h3>
                  <form onSubmit={handleSaveTruck}>
                    <input placeholder="Nr. (ex: B 123 ABC)" value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})} style={inputStyle}/>
                    {errors.licensePlate && <div style={{color: '#ef4444', fontSize: '13px', marginTop: '4px'}}>{errors.licensePlate}</div>}
                    
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                      <div style={{flex: 1}}>
                        <input placeholder="Brand" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} style={inputStyle}/>
                        {errors.brand && <div style={{color: '#ef4444', fontSize: '13px', marginTop: '4px'}}>{errors.brand}</div>}
                      </div>
                      <div style={{flex: 1}}>
                        <input placeholder="Model" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} style={inputStyle}/>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                      <div style={{ flex: 1 }}><label style={{fontSize:'13px', color: '#64748b'}}>RCA Expirare</label><input type="date" value={formData.rcaExpiry} onChange={e => setFormData({...formData, rcaExpiry: e.target.value, rcaStartDate: e.target.value})} style={inputStyle}/></div>
                      <div style={{ flex: 1 }}><label style={{fontSize:'13px', color: '#64748b'}}>ITP Expirare</label><input type="date" value={formData.itpExpiry} onChange={e => setFormData({...formData, itpExpiry: e.target.value, itpStartDate: e.target.value})} style={inputStyle}/></div>
                      <div style={{ flex: 1 }}><label style={{fontSize:'13px', color: '#64748b'}}>Rovinietă Expirare</label><input type="date" value={formData.rovinietaExpiry} onChange={e => setFormData({...formData, rovinietaExpiry: e.target.value, rovinietaStartDate: e.target.value})} style={inputStyle}/></div>
                    </div>
                    
                    <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
                      <button type="submit" style={{ ...btnStyle, backgroundColor: '#10b981', color: 'white', flex: 1 }}>{editId ? "Salvează Modificările" : "Adaugă în Flotă"}</button>
                      {editId && <button type="button" onClick={() => {setEditId(null); setFormData(emptyForm);}} style={{ ...btnStyle, backgroundColor: '#ef4444', color: 'white' }}>Anulează</button>}
                    </div>
                  </form>
                </div>

                <div style={{...cardStyle, padding: '0', overflow: 'hidden'}}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '15px', borderBottom: `1px solid ${borderColor}` }}>Nr. Inmatriculare</th>
                        <th style={{ padding: '15px', borderBottom: `1px solid ${borderColor}` }}>Brand</th>
                        <th style={{ padding: '15px', borderBottom: `1px solid ${borderColor}` }}>Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTrucks.map(truck => (
                        <tr key={truck.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '15px', fontWeight: '500' }}>{truck.licensePlate}</td>
                          <td style={{ padding: '15px', color: theme==='dark'?'#94a3b8':'#64748b' }}>{truck.brand}</td>
                          <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                            <button onClick={() => navigateTo('detail', truck)} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', fontWeight: '600' }}>Vezi</button>
                            <button onClick={() => handleEditClick(truck)} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '6px', fontWeight: '600' }}>Editează</button>
                            <button onClick={() => handleDelete(truck.id)} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', fontWeight: '600' }}>Șterge</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: '15px', display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center', backgroundColor: cardBgColor }}>
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ ...btnStyle, padding: '8px 15px', backgroundColor: theme === 'dark' ? '#334155' : '#e2e8f0', color: textColor, opacity: currentPage === 1 ? 0.5 : 1 }}>Înapoi</button>
                    <span style={{fontWeight: '500'}}> {currentPage} / {totalPages || 1} </span>
                    <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)} style={{ ...btnStyle, padding: '8px 15px', backgroundColor: theme === 'dark' ? '#334155' : '#e2e8f0', color: textColor, opacity: currentPage >= totalPages ? 0.5 : 1 }}>Înainte</button>
                  </div>
                </div>
              </div>

              {/* COLOANA DREAPTĂ */}
              <div className="grid-item">
                
                {view === 'detail' && selectedTruck && (
                  <div className="fade-in" style={{ ...cardStyle, borderLeft: '6px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{selectedTruck.licensePlate}</h2>
                      <button onClick={() => navigateTo('master')} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', padding: '5px 10px', borderRadius: '6px' }}>✕</button>
                    </div>
                    <p style={{fontSize: '1.1rem', color: theme === 'dark'?'#cbd5e1':'#475569'}}><strong>Brand / Model:</strong> {selectedTruck.brand} {selectedTruck.model}</p>
                    <div style={{ height: '1px', backgroundColor: borderColor, margin: '20px 0' }} />
                    <h4 style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Valabilitate Documente</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: theme==='dark'?'#0f172a':'#f8fafc', borderRadius: '8px' }}>
                        <span style={{fontWeight: '600'}}>RCA</span>
                        <span style={{ color: '#ef4444', fontWeight: '700' }}>{selectedTruck.rcaExpiry}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: theme==='dark'?'#0f172a':'#f8fafc', borderRadius: '8px' }}>
                        <span style={{fontWeight: '600'}}>ITP</span>
                        <span style={{ color: '#ef4444', fontWeight: '700' }}>{selectedTruck.itpExpiry}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: theme==='dark'?'#0f172a':'#f8fafc', borderRadius: '8px' }}>
                        <span style={{fontWeight: '600'}}>Rovinietă</span>
                        <span style={{ color: '#ef4444', fontWeight: '700' }}>{selectedTruck.rovinietaExpiry}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0, marginBottom: '5px' }}>Analiză Flotă</h3>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 20px 0' }}>Distribuția camioanelor per brand</p>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} axisLine={false} tickLine={false} />
                      <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: theme === 'dark' ? '#334155' : '#f1f5f9'}} contentStyle={{ backgroundColor: cardBgColor, borderColor: borderColor, color: textColor, borderRadius: '8px', boxShadow: shadowStyle, border: 'none' }} />
                      <Bar dataKey="camioane" fill="#3b82f6" radius={[6, 6, 0, 0]} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;