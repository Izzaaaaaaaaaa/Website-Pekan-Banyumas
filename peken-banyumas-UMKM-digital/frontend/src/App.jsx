import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import SelectRole from "./pages/auth/SelectRole";
import Login from "./pages/auth/Login";
import LupaPass from "./pages/auth/LupaPass"
import Register from "./pages/auth/Register";
import Status from "./pages/auth/Status";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ManajemenStok from "./pages/ManajemenStok";
import BukuKas from "./pages/BukuKas";
import PromoDiskon from "./pages/PromoDiskon";
import Riwayat from "./pages/Riwayat";
import Pengaturan from "./pages/Pengaturan";
import Profile from "./pages/Profile";
import Notifikasi from "./pages/Notifikasi";

function App() {
  return (
    <BrowserRouter>
    <Toaster/>

      <Routes>
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/login" element={<Login />} />
          <Route path="/lupa-pass" element={<LupaPass />} />
          <Route path="/register" element={<Register />} />
          <Route path="/status" element={<Status />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/notifikasi" element={<Notifikasi />} />
          <Route path="stok" element={<ManajemenStok />} />
          <Route path="kas" element={<BukuKas />} />
          <Route path="promo" element={<PromoDiskon />} />
          <Route path="riwayat" element={<Riwayat />} />
          <Route path="pengaturan" element={<Pengaturan />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;