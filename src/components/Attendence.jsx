import React, { useState, useEffect } from 'react';
import { Download, LogOut, Users, Clock, MapPin, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';

export default function AttendanceTracker() {
  const [currentView, setCurrentView] = useState('login');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  const fetchAttendanceRecords = async () => {
    try {
      const attendanceCollection = collection(db, 'attendance');
      const q = query(attendanceCollection, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  const LoginView = () => {
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleEmployeeClick = () => {
      setCurrentView('employee-registration');
    };

    const handleAdminLogin = async () => {
      if (!username.trim() || !password.trim()) {
        setError('Please enter both email and password');
        return;
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, username, password);
        setCurrentUser(userCredential.user);
        setCurrentView('admin-dashboard');
        setError('');
      } catch (error) {
        console.error('Login error:', error);
        switch (error.code) {
          case 'auth/user-not-found':
            setError('No admin account found with this email');
            break;
          case 'auth/wrong-password':
            setError('Incorrect password');
            break;
          case 'auth/invalid-email':
            setError('Invalid email format');
            break;
          default:
            setError('Login failed. Please try again.');
        }
      }
    };

    if (showAdminLogin) {
      return (
        <div className="min-h-screen flex items-center justify-center main-div p-4" style={{marginTop: '20px'}}> 
          <div className="login-container">
            <div className="login-header">
              <div className="icon-wrapper">
                <Users className="header-icon" />
              </div>
              <h1 className="login-title">Admin Login</h1>
              <p className="login-subtitle">Enter your credentials</p>
            </div>

            <div className="login-form">
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Enter admin email"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter password"
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
              </div>

              {error && <div className="error-message">
                <AlertCircle size={16} />
                {error}
              </div>}

              <div className="button-group">
                <button onClick={handleAdminLogin} className="btn btn-admin">
                  Login
                </button>
                <button onClick={() => setShowAdminLogin(false)} className="btn btn-secondary">
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 main-div">
        <div className="login-container">
          <div className="login-header">
            <div className="icon-wrapper">
              <Clock className="header-icon" />
            </div>
            <h1 className="login-title">Attendance Tracker</h1>
            <p className="login-subtitle">Hello, Good Morning...😊</p>
          </div>

          <div className="login-form">
            <p className="select-text">Please select your role</p>
            
            <div className="button-group">
              <button onClick={handleEmployeeClick} className="btn btn-employee btn-large">
                <Users size={24} />
                <div className="btn-content">
                  <span className="btn-title">Employee</span>
                  <span className="btn-desc">Mark your attendance</span>
                </div>
              </button>
              
              <button onClick={() => setShowAdminLogin(true)} className="btn btn-admin btn-large">
                <Users size={24} />
                <div className="btn-content">
                  <span className="btn-title">Admin</span>
                  <span className="btn-desc">View attendance records</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AlreadyMarkedView = () => {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="already-marked-container">
          <div className="success-icon">
            <Clock size={48} />
          </div>
          <h2 className="already-title">Already Marked</h2>
          <p className="already-message">
            You have already marked your attendance today.
          </p>
          <div className="button-group">
            <button onClick={() => setCurrentView('login')} className="btn btn-secondary">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EmployeeRegistration = () => {
    const [name, setName] = useState('');
    const [workOption, setWorkOption] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locationStatus, setLocationStatus] = useState('checking');

    useEffect(() => {
      if (navigator.geolocation) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'granted') {
            setLocationStatus('granted');
          } else if (result.state === 'denied') {
            setLocationStatus('denied');
          } else {
            setLocationStatus('prompt');
          }
        }).catch(() => {
          setLocationStatus('prompt');
        });
      } else {
        setLocationStatus('denied');
      }
    }, []);

    const getLocation = () => {
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocationStatus('granted');
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            (error) => {
              console.error('Location error:', error);
              setLocationStatus('denied');
              resolve({ latitude: null, longitude: null });
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          setLocationStatus('denied');
          resolve({ latitude: null, longitude: null });
        }
      });
    };

    const handleSubmit = async () => {
      if (!name.trim()) {
        alert('Please enter your full name');
        return;
      }

      if (!workOption) {
        alert('Please select your attendance type');
        return;
      }

      // Check if this person already marked today
      const today = new Date().toLocaleDateString();
      const alreadyMarked = attendanceRecords.some(
        record => record.employeeName.toLowerCase() === name.trim().toLowerCase() && record.date === today
      );

      if (alreadyMarked) {
        alert('You have already marked attendance today!');
        return;
      }

      setIsSubmitting(true);
      
      const location = await getLocation();
      const now = new Date();

      const record = {
        employeeName: name.trim(),
        username: name.trim().toLowerCase().replace(/\s+/g, '_'),
        workOption: workOption,
        timestamp: Timestamp.fromDate(now),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        location: location.latitude 
          ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` 
          : 'Location not available'
      };

      try {
        await addDoc(collection(db, 'attendance'), record);
        await fetchAttendanceRecords();
        setIsSubmitting(false);
        setCurrentView('success');
      } catch (error) {
        console.error('Error saving attendance record:', error);
        alert('Error saving attendance. Please try again.');
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 main-div" style={{ marginTop: '0px' }}>
        <div className="employee-container">
          <div className="employee-header">
            <h2 className="employee-title">Mark Your Attendance</h2>
            <p className="employee-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="employee-form">
            <div className="input-group">
              <label className="input-label">
                <Users size={16} />
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <MapPin size={16} />
                Mark Your Attendance <span className="required">*</span>
              </label>
              <select
                value={workOption}
                onChange={(e) => setWorkOption(e.target.value)}
                className="input-field select-field"
              >
                <option value="">Select attendance type</option>
                <option value="Work From Home">🏠 Work From Home</option>
                <option value="Work From Office">🏢 Work From Office</option>
                <option value="On Leave">🌴 On Leave</option>
              </select>
            </div>

            <div className={`info-box ${locationStatus === 'denied' ? 'warning-box' : ''}`}>
              <MapPin size={16} />
              {locationStatus === 'granted' && (
                <span>✓ Location tracking enabled - Your coordinates will be recorded</span>
              )}
              {locationStatus === 'prompt' && (
                <span>📍 Please allow location access when prompted</span>
              )}
              {locationStatus === 'denied' && (
                <span>⚠️ Location access denied - Attendance will be marked without location</span>
              )}
              {locationStatus === 'checking' && (
                <span>Checking location permissions...</span>
              )}
            </div>

            <div className="info-box">
              <Clock size={16} />
              <span>Timestamp: {new Date().toLocaleString()}</span>
            </div>

            <div className="button-group">
              <button 
                onClick={handleSubmit} 
                className="btn btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
              </button>
              
              <button 
                onClick={() => {
                  setCurrentView('login');
                  setCurrentUser(null);
                }} 
                className="btn btn-secondary"
              >
                <LogOut size={18} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SuccessView = () => {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 main-div">
        <div className="success-container">
          <div className="success-animation">
            <CheckCircle size={80} />
          </div>
          <h2 className="success-title">Attendance Marked Successfully!</h2>
          <p className="success-message">Your attendance has been recorded. Have a great day!</p>
          <button 
            onClick={() => {
              setCurrentView('login');
              setCurrentUser(null);
            }} 
            className="btn btn-done"
          >
            <LogOut size={18} />
            Back to Login
          </button>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const filteredRecords = attendanceRecords.filter(record => {
      const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !dateFilter || record.date === dateFilter;
      
      if (filter === 'today') {
        const today = new Date().toLocaleDateString();
        return matchesSearch && record.date === today;
      }
      return matchesSearch && matchesDate;
    });

    const downloadExcel = () => {
      const headers = ['ID', 'Employee Name', 'Work Option', 'Date', 'Time', 'Location'];
      const csvContent = [
        headers.join(','),
        ...filteredRecords.map(record => 
          [
            record.id,
            record.employeeName,
            record.workOption,
            record.date,
            record.time,
            `"${record.location}"`
          ].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    };

    const todayCount = attendanceRecords.filter(r => r.date === new Date().toLocaleDateString()).length;
    const totalCount = attendanceRecords.length;

    return (
      <div className="min-h-screen p-6">
        <div className="admin-container">
          <div className="admin-header">
            <div className="admin-title-section">
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">Manage and monitor attendance records</p>
            </div>
            <button 
              onClick={async () => {
                try {
                  await signOut(auth);
                  setCurrentUser(null);
                  setCurrentView('login');
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }} 
              className="btn btn-logout"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <Calendar className="stat-icon" />
              <div className="stat-content">
                <p className="stat-label">Today's Attendance</p>
                <p className="stat-value">{todayCount}</p>
              </div>
            </div>
            <div className="stat-card">
              <Users className="stat-icon" />
              <div className="stat-content">
                <p className="stat-label">Total Records</p>
                <p className="stat-value">{totalCount}</p>
              </div>
            </div>
            <div className="stat-card">
              <Clock className="stat-icon" />
              <div className="stat-content">
                <p className="stat-label">Last Update</p>
                <p className="stat-value">
                  {attendanceRecords.length > 0 
                    ? (attendanceRecords[attendanceRecords.length - 1].timestamp?.toDate 
                        ? attendanceRecords[attendanceRecords.length - 1].timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(attendanceRecords[attendanceRecords.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                    : 'No data'}
                </p>
              </div>
            </div>
          </div>

          <div className="controls-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="date-filter-box">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="date-input"
              />
              <button 
                onClick={() => setDateFilter('')} 
                className="btn btn-clear"
              >
                Clear Date
              </button>
            </div>

            <div className="filter-buttons">
              <button 
                onClick={() => setFilter('all')} 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              >
                All Records
              </button>
              <button 
                onClick={() => setFilter('today')} 
                className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
              >
                Today Only
              </button>
              <button onClick={downloadExcel} className="btn btn-download">
                <Download size={18} />
                Export Excel
              </button>
            </div>
          </div>

          <div className="table-container">
            {filteredRecords.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <p>No attendance records found</p>
              </div>
            ) : (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Username</th>
                    <th>Work Option</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="employee-cell">
                        <Users size={16} />
                        {record.employeeName}
                      </td>
                      <td>{record.username}</td>
                      <td>
                        <span className="work-badge">{record.workOption}</span>
                      </td>
                      <td>{record.date}</td>
                      <td>{record.time}</td>
                      <td className="location-cell">
                        <MapPin size={14} />
                        {record.location}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="sparkle"></div>
      <div className="sparkle"></div>
      <div className="sparkle"></div>
      <div className="sparkle"></div>
      <div className="sparkle"></div>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Outfit:wght@600;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }

        body {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(-45deg, #FFE5B4, #FFDAB9, #FFB6C1, #FFA07A, #FF8C69, #FFF8DC);
          background-size: 400% 400%;
          animation: gradientShift 20s ease infinite;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 50%, rgba(255, 229, 180, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 218, 185, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(255, 182, 193, 0.25) 0%, transparent 40%);
          pointer-events: none;
          animation: float 20s ease-in-out infinite;
        }

        body::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 60% 70%, rgba(255, 248, 220, 0.15) 0%, transparent 50%);
          pointer-events: none;
          animation: float 25s ease-in-out infinite reverse;
        }

        .sparkle {
          position: fixed;
          width: 5px;
          height: 5px;
          background: linear-gradient(135deg, #e6e6fa, #ba55d3);
          border-radius: 50%;
          pointer-events: none;
          animation: sparkle 4s ease-in-out infinite;
          box-shadow: 0 0 10px rgba(186, 85, 211, 0.5);
        }

        .sparkle:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
        .sparkle:nth-child(2) { top: 60%; left: 80%; animation-delay: 0.8s; }
        .sparkle:nth-child(3) { top: 40%; left: 30%; animation-delay: 1.6s; }
        .sparkle:nth-child(4) { top: 80%; left: 60%; animation-delay: 2.4s; }
        .sparkle:nth-child(5) { top: 15%; left: 70%; animation-delay: 3.2s; }

        .main-div {
          display: flex;
          justify-content: center;
          margin-top: 60px;
        }

        /* Login View */
        .login-container {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 30px;
          padding: 50px;
          width: 100%;
          max-width: 480px;
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.18);
          animation: slideUpFade 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }

        .login-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 200px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
          border-radius: 30px 30px 0 0;
          pointer-events: none;
        }

        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
        }

        .icon-wrapper {
          display: inline-flex;
          padding: 20px;
          background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
          border-radius: 24px;
          margin-bottom: 20px;
          animation: floatPulse 3s ease-in-out infinite;
          box-shadow: 
            0 10px 40px rgba(139, 0, 0, 0.4),
            0 0 0 10px rgba(139, 0, 0, 0.1);
          position: relative;
        }

        .icon-wrapper::after {
          content: '';
          position: absolute;
          inset: -4px;
          background: linear-gradient(135deg, #8B0000, #DC143C);
          border-radius: 24px;
          z-index: -1;
          opacity: 0;
          animation: glowPulse 3s ease-in-out infinite;
        }

        @keyframes floatPulse {
          0%, 100% { 
            transform: translateY(0px) scale(1);
          }
          50% { 
            transform: translateY(-10px) scale(1.05);
          }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.5; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .header-icon {
          width: 40px;
          height: 40px;
          color: white;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .admin-title {
          font-family: 'Outfit', sans-serif;
          font-size: 38px;
          font-weight: 800;
          background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
          letter-spacing: -1px;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
        }

        .login-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          z-index: 1;
        }

        .select-text {
          text-align: center;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
          margin-bottom: -8px;
          animation: fadeIn 0.8s ease-out 0.3s both;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .btn-large {
          padding: 28px 24px;
          flex-direction: row;
          justify-content: flex-start;
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .btn-large::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .btn-large:hover::before {
          width: 400px;
          height: 400px;
        }

        .btn-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .btn-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .btn-desc {
          font-size: 13px;
          opacity: 0.85;
          font-weight: 400;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: slideUp 0.6s ease-out both;
        }

        .input-group:nth-child(1) { animation-delay: 0.1s; }
        .input-group:nth-child(2) { animation-delay: 0.2s; }
        .input-group:nth-child(3) { animation-delay: 0.3s; }

        .required {
          color: #fca5a5;
          font-weight: 700;
          font-size: 16px;
        }

        .input-label {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: 0.3px;
        }

        .input-field {
          padding: 16px 18px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          font-size: 15px;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          font-family: 'Poppins', sans-serif;
          color: white;
          font-weight: 500;
        }

        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .input-field:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 0 0 4px rgba(255, 255, 255, 0.1),
            0 10px 30px rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
        }

        .select-field {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 20px;
          padding-right: 40px;
        }

        .select-field option {
          background: #8B0000;
          color: white;
          padding: 10px;
        }

        .error-message {
          padding: 14px 18px;
          background: rgba(254, 202, 202, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(252, 129, 129, 0.5);
          border-radius: 14px;
          color: #fecaca;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 10px;
        }

        .btn {
          padding: 16px 28px;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: 'Poppins', sans-serif;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.3px;
        }

        .btn::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .btn:hover::after {
          width: 300px;
          height: 300px;
        }

        .btn > * {
          position: relative;
          z-index: 1;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .btn-employee {
          background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
          color: white;
          box-shadow: 
            0 10px 30px rgba(139, 0, 0, 0.4),
            0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .btn-employee:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 
            0 15px 40px rgba(139, 0, 0, 0.5),
            0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 12px 0;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .divider span {
          padding: 0 14px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 500;
        }

        .admin-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .admin-password {
          font-size: 14px;
        }

        .btn-admin {
          background: linear-gradient(135deg, #4A4A4A 0%, #6B6B6B 100%);
          color: white;
          box-shadow: 
            0 10px 30px rgba(74, 74, 74, 0.4),
            0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .btn-admin:hover:not(:disabled) {
          background: linear-gradient(135deg, #2A2A2A 0%, #4A4A4A 100%);
          transform: translateY(-3px);
          box-shadow: 
            0 15px 40px rgba(74, 74, 74, 0.5),
            0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .login-footer {
          margin-top: 28px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .hint-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 10px 16px;
          border-radius: 12px;
          display: inline-block;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Employee Registration */
        .employee-container {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 30px;
          padding: 50px;
          width: 100%;
          max-width: 550px;
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.18);
          animation: slideUpFade 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }

        .employee-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 250px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
          border-radius: 30px 30px 0 0;
          pointer-events: none;
        }

        .employee-header {
          margin-bottom: 36px;
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .user-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
          color: white;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
          box-shadow: 0 8px 20px rgba(139, 0, 0, 0.4);
          animation: slideUp 0.6s ease-out 0.2s both;
        }

        .employee-title {
          font-family: 'Outfit', sans-serif;
          font-size: 34px;
          font-weight: 800;
          background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
          letter-spacing: -1px;
          animation: slideUp 0.6s ease-out 0.3s both;
        }

        .employee-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 500;
          animation: slideUp 0.6s ease-out 0.4s both;
        }

        .employee-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
          position: relative;
          z-index: 1;
        }

        .info-box {
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.15);
          animation: slideUp 0.6s ease-out both;
          transition: all 0.3s ease;
        }

        .info-box:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .warning-box {
          background: rgba(254, 202, 202, 0.15);
          border: 1px solid rgba(252, 129, 129, 0.4);
          color: #fecaca;
        }

        .btn-submit {
          background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
          color: white;
          padding: 18px;
          font-size: 17px;
          box-shadow: 
            0 10px 30px rgba(139, 0, 0, 0.4),
            0 1px 3px rgba(0, 0, 0, 0.1);
          animation: slideUp 0.6s ease-out 0.6s both;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 
            0 15px 40px rgba(139, 0, 0, 0.5),
            0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: slideUp 0.6s ease-out 0.7s both;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* Success View */
        .success-container, .already-marked-container {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 30px;
          padding: 70px 50px;
          width: 100%;
          max-width: 520px;
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.18);
          text-align: center;
          animation: slideUpFade 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }

        .success-container::before {
          content: '🎉';
          position: absolute;
          font-size: 100px;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          animation: celebrate 1s ease-out;
        }

        @keyframes celebrate {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(20px) scale(0);
          }
          50% {
            transform: translateX(-50%) translateY(-10px) scale(1.2);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        .success-animation {
          margin-bottom: 28px;
          animation: successPop 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
        }

        .success-animation svg {
          color: #8B0000;
          filter: drop-shadow(0 10px 20px rgba(139, 0, 0, 0.4));
        }

        .success-icon {
          margin-bottom: 28px;
          animation: successPop 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
        }

        .success-icon svg {
          color: #8B0000;
          filter: drop-shadow(0 10px 20px rgba(139, 0, 0, 0.4));
        }

        @keyframes successPop {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .success-title, .already-title {
          font-family: 'Outfit', sans-serif;
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 14px;
          letter-spacing: -0.5px;
          animation: slideUp 0.6s ease-out 0.4s both;
        }

        .success-message, .already-message {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 36px;
          line-height: 1.7;
          animation: slideUp 0.6s ease-out 0.5s both;
        }

        .already-info {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 28px;
          text-align: left;
          animation: slideUp 0.6s ease-out 0.6s both;
        }

        .already-info p {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 10px;
        }

        .already-info p:last-child {
          margin-bottom: 0;
        }

        .btn-done, .btn-back {
          background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
          color: white;
          padding: 16px 40px;
          display: inline-flex;
          box-shadow: 
            0 10px 30px rgba(139, 0, 0, 0.4),
            0 1px 3px rgba(0, 0, 0, 0.1);
          animation: slideUp 0.6s ease-out 0.7s both;
        }

        .btn-done:hover, .btn-back:hover {
          transform: translateY(-3px);
          box-shadow: 
            0 15px 40px rgba(139, 0, 0, 0.5),
            0 5px 15px rgba(0, 0, 0, 0.2);
        }

        /* Admin Dashboard */
        .admin-container {
          max-width: 1400px;
          margin: 0 auto;
          animation: fadeIn 0.8s ease-out;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 36px;
        }

        .admin-subtitle {
          font-size: 16px;
          color: #2C3E50;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
  letter-spacing: 0.5px;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.3);
}

        .btn-logout:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 36px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 20px;
          padding: 28px;
          display: flex;
          align-items: center;
          gap: 18px;
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.25),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.18);
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          animation: slideUp 0.6s ease-out both;
        }

        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 15px 40px 0 rgba(31, 38, 135, 0.35),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.4);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          padding: 14px;
          background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
          color: white;
          border-radius: 16px;
          box-shadow: 0 8px 20px rgba(139, 0, 0, 0.4);
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 13px;
          color: #2C3E50;
          font-weight: 700;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-family: 'Outfit', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #34495E;
        }

        .controls-section {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 28px;
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.25),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.18);
          animation: slideUp 0.6s ease-out 0.4s both;
        }

        .search-box {
          margin-bottom: 18px;
        }

        .search-input {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 14px;
          font-size: 15px;
          font-family: 'Poppins', sans-serif;
          color: white;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .search-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
        }

        .filter-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .filter-btn {
          padding: 12px 22px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          font-family: 'Poppins', sans-serif;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 8px 20px rgba(139, 0, 0, 0.4);
        }

        .filter-btn:hover:not(.active) {
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .btn-download {
          background: linear-gradient(135deg, #4A4A4A 0%, #6B6B6B 100%);
          color: white;
          margin-left: auto;
          box-shadow: 0 8px 20px rgba(74, 74, 74, 0.4);
        }

        .btn-download:hover {
          background: linear-gradient(135deg, #2A2A2A 0%, #4A4A4A 100%);
          box-shadow: 0 12px 28px rgba(74, 74, 74, 0.5);
        }

        .table-container {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 20px;
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.25),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.18);
          overflow: hidden;
          animation: slideUp 0.6s ease-out 0.5s both;
        }

        .attendance-table {
          width: 100%;
          border-collapse: collapse;
        }

        .attendance-table thead {
          background: linear-gradient(135deg, rgba(139, 0, 0, 0.5) 0%, rgba(220, 20, 60, 0.4) 100%);
          backdrop-filter: blur(10px);
          color: white;
        }

        .attendance-table th {
          padding: 18px;
          text-align: left;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .attendance-table tbody tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .attendance-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .attendance-table td {
          padding: 18px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
        }

        .employee-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }

        .work-badge {
          display: inline-block;
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 14px;
          font-size: 13px;
          font-weight: 600;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .location-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .empty-state {
          padding: 80px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
        }

        .empty-state svg {
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-state p {
          font-size: 17px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
        }

        .date-filter-box {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 15px;
        }

        .date-input {
          padding: 12px 16px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          font-size: 14px;
          color: white;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .date-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 0 0 4px rgba(255, 255, 255, 0.1),
            0 10px 30px rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
        }

        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }

        .btn-clear {
          background: linear-gradient(135deg, #666 0%, #888 100%);
          color: white;
          padding: 12px 20px;
          border: none;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 102, 102, 0.3);
        }

        .btn-clear:hover {
          background: linear-gradient(135deg, #555 0%, #777 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 102, 102, 0.4);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .admin-container {
            padding: 0 20px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
          }
        }

        @media (max-width: 1024px) {
          .admin-header {
            flex-direction: column;
            gap: 20px;
            align-items: flex-start;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }

          .filter-buttons {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 768px) {
          .main-div {
            margin-top: 20px;
          }

          .login-container, .employee-container, .success-container, .already-marked-container {
            padding: 32px 20px;
            margin: 0 16px;
            max-width: calc(100% - 32px);
          }

          .admin-container {
            padding: 0 16px;
          }

          .admin-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .stat-card {
            padding: 20px;
          }

          .stat-value {
            font-size: 28px;
          }

          .controls-section {
            padding: 20px;
          }

          .filter-buttons {
            flex-direction: column;
            gap: 12px;
          }

          .btn-download {
            margin-left: 0;
            width: 100%;
            justify-content: center;
          }

          .date-filter-box {
            flex-direction: column;
            gap: 12px;
          }

          .date-input {
            width: 100%;
          }

          .btn-clear {
            width: 100%;
          }

          .attendance-table {
            font-size: 12px;
          }

          .attendance-table th,
          .attendance-table td {
            padding: 10px 6px;
          }

          .employee-cell {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .location-cell {
            font-size: 11px;
            word-break: break-all;
          }

          .btn-large {
            padding: 20px 16px;
            flex-direction: column;
            text-align: center;
          }

          .btn-content {
            align-items: center;
          }

          .login-title {
            font-size: 32px;
          }

          .admin-title {
            font-size: 28px;
          }

          .icon-wrapper {
            padding: 16px;
          }

          .header-icon {
            width: 32px;
            height: 32px;
          }
        }

        @media (max-width: 480px) {
          .login-container, .employee-container, .success-container, .already-marked-container {
            padding: 24px 16px;
            margin: 0 12px;
            max-width: calc(100% - 24px);
          }

          .admin-container {
            padding: 0 12px;
          }

          .login-title {
            font-size: 28px;
          }

          .admin-title {
            font-size: 24px;
          }

          .stat-card {
            padding: 16px;
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .stat-icon {
            width: 48px;
            height: 48px;
            padding: 12px;
          }

          .stat-value {
            font-size: 24px;
          }

          .controls-section {
            padding: 16px;
          }

          .attendance-table {
            font-size: 11px;
          }

          .attendance-table th,
          .attendance-table td {
            padding: 8px 4px;
          }

          .work-badge {
            font-size: 11px;
            padding: 4px 8px;
          }

          .btn {
            padding: 14px 20px;
            font-size: 14px;
          }

          .btn-submit {
            padding: 16px;
            font-size: 16px;
          }

          .input-field {
            padding: 14px 16px;
            font-size: 14px;
          }

          .search-input {
            padding: 12px 16px;
            font-size: 14px;
          }

          .date-input {
            padding: 10px 14px;
            font-size: 14px;
          }

          .filter-btn {
            padding: 10px 16px;
            font-size: 13px;
          }
        }

        @media (max-width: 360px) {
          .login-container, .employee-container, .success-container, .already-marked-container {
            padding: 20px 12px;
            margin: 0 8px;
            max-width: calc(100% - 16px);
          }

          .admin-container {
            padding: 0 8px;
          }

          .login-title {
            font-size: 24px;
          }

          .admin-title {
            font-size: 20px;
          }

          .stat-value {
            font-size: 20px;
          }

          .attendance-table {
            font-size: 10px;
          }

          .attendance-table th,
          .attendance-table td {
            padding: 6px 3px;
          }

          .btn {
            padding: 12px 16px;
            font-size: 13px;
          }
        }
      `}</style>

      {currentView === 'login' && <LoginView />}
      {currentView === 'employee-registration' && <EmployeeRegistration />}
      {currentView === 'success' && <SuccessView />}
      {currentView === 'admin-dashboard' && <AdminDashboard />}
    </>
  );
}