import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("isLogin") !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  const [open, setOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={open} setOpen={setOpen} />

      <main className="main">
        <button 
          className="menu-toggle"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
        <Outlet />
      </main>
    </div>
  );
}