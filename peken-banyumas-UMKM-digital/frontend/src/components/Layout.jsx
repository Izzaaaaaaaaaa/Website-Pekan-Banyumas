import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {

  const navigate = useNavigate();

  useEffect(() => {
    const login =
      localStorage.getItem("isLogin");
    if (
      login !== "true"
      &&
      window.location.pathname !== "/login"
    ) {
      navigate("/login", {
        replace:true
      });
    }
  }, []);

  const [open, setOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={open} setOpen={setOpen} />

      <main className="main">

        <div className="mobile-header">

          <button
            className="menu-toggle"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>

          <span className="mobile-title">
            Peken Banyumasan
          </span>

        </div>

        <Outlet />

      </main>
    </div>
  );
}