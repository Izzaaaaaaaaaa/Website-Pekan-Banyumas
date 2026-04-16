import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { getToken } from './services/api';
import Layout from './components/Layout';

import Login     from './pages/auth/Login';
import Register  from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Profil    from './pages/Profil';
import Portofolio from './pages/Portofolio';
import Aktivitas from './pages/Aktivitas';
import Event     from './pages/Event';
import Notifikasi from './pages/Notifikasi';
import Pengaturan from './pages/Pengaturan';

const Pub  = ({children}) => getToken() ? <Navigate to="/dashboard" replace/> : children;
const Auth = ({children}) => getToken() ? children : <Navigate to="/login" replace/>;

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"  element={<Pub><Login/></Pub>}/>
          <Route path="/daftar" element={<Pub><Register/></Pub>}/>
          <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
          <Route path="/dashboard" element={<Auth><Layout/></Auth>}>
            <Route index                  element={<Dashboard/>}/>
            <Route path="profil"          element={<Profil/>}/>
            <Route path="portofolio"      element={<Portofolio/>}/>
            <Route path="aktivitas"           element={<Aktivitas/>}/>
            <Route path="event"           element={<Event/>}/>
            <Route path="notifikasi"      element={<Notifikasi/>}/>
            <Route path="pengaturan"      element={<Pengaturan/>}/>
          </Route>
          <Route path="*" element={<Navigate to={getToken()?'/dashboard':'/login'} replace/>}/>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
