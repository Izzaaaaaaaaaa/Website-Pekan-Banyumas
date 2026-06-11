import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

import SelectRole    from "./pages/auth/SelectRole";
import Login         from "./pages/auth/Login";
import LupaPass      from "./pages/auth/LupaPass";
import ResetPassword from "./pages/auth/ResetPassword";
import Register      from "./pages/auth/Register";
import Status        from "./pages/auth/Status";
import Layout        from "./components/Layout";
import Dashboard     from "./pages/Dashboard";
import ManajemenStok from "./pages/ManajemenStok";
import BukuKas       from "./pages/BukuKas";
import Event         from "./pages/Event";
import Riwayat       from "./pages/Riwayat";
import Pengaturan    from "./pages/Pengaturan";
import Profile       from "./pages/Profile";
import Notifikasi    from "./pages/Notifikasi";

function ProtectedRoute({ children }) {
  const isLogin = localStorage.getItem("isLogin") === "true";
  return isLogin ? children : <Navigate to="/login" />;
}

function App() {
  const [isLogin, setIsLogin] = useState(
    localStorage.getItem("isLogin") === "true"
  );

  // Sync Supabase session → localStorage + state saat token di-refresh otomatis
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          localStorage.setItem("token", session.access_token);
          localStorage.setItem("isLogin", "true");
          setIsLogin(true);
        } else if (event === "SIGNED_OUT") {
          localStorage.clear();
          setIsLogin(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Toaster />
      <Routes>
        <Route path="/select-role"    element={<SelectRole />} />
        <Route
          path="/login"
          element={isLogin ? <Navigate to="/" /> : <Login />}
        />
        <Route path="/lupa-pass"      element={<LupaPass />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/status"         element={<Status />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index           element={<Dashboard />} />
          <Route path="notifikasi" element={<Notifikasi />} />
          <Route path="stok"     element={<ManajemenStok />} />
          <Route path="kas"      element={<BukuKas />} />
          <Route path="event"    element={<Event />} />
          <Route path="riwayat"  element={<Riwayat />} />
          <Route path="pengaturan" element={<Pengaturan />} />
          <Route path="profile"  element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
