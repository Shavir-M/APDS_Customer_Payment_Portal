import React from 'react';
import { Route, Routes } from 'react-router-dom'; 
import LoginPage from './Login/LoginPage';
import Registration from './Registration/Registration';
import HomePage from './Home/HomePage';
import UserDash from './Dashboards/UserDash';
import AdminDash from './Dashboards/AdminDash';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/" element={<HomePage />} /> {/* Default route */}
        <Route path="/user-dashboard" element={<UserDash />} />
        <Route path="/admin-dashboard" element={<AdminDash />} />
      </Routes>
    </div>
  );
}

export default App;