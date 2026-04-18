import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Navigate } from "react-router-dom";

import SelectRole from "./pages/auth/SelectRole";
import Login from "./pages/auth/Login";
import LupaPass from "./pages/auth/LupaPass"
import Register from "./pages/auth/Register";
import Status from "./pages/auth/Status";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ManajemenStok from "./pages/ManajemenStok";
import BukuKas from "./pages/BukuKas";
import Event from "./pages/Event";
import Riwayat from "./pages/Riwayat";
import Pengaturan from "./pages/Pengaturan";
import Profile from "./pages/Profile";
import Notifikasi from "./pages/Notifikasi";

function ProtectedRoute({ children }) {
  const isLogin = localStorage.getItem("isLogin") === "true";
  return isLogin ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
    <Toaster/>

      <Routes>
          <Route path="/select-role" element={<SelectRole />} />
          <Route 
            path="/login" 
            element={
              localStorage.getItem("isLogin") === "true"
                ? <Navigate to="/" />
                : <Login />
            } 
          />
          <Route path="/lupa-pass" element={<LupaPass />} />
          <Route path="/register" element={<Register />} />
          <Route path="/status" element={<Status />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/notifikasi" element={<Notifikasi />} />
          <Route path="stok" element={<ManajemenStok />} />
          <Route path="kas" element={<BukuKas />} />
          <Route path="event" element={<Event />} />
          <Route path="riwayat" element={<Riwayat />} />
          <Route path="pengaturan" element={<Pengaturan />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;