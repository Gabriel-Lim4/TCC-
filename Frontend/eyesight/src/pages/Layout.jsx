import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import "../styles/Dashboard.css";

function Layout() {
  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;