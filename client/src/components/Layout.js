import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './layout.css';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="topbarInner">
          <Link className="brand" to="/">
            Blog
          </Link>

          <nav className="nav">
            <NavLink to="/" end>
              Home
            </NavLink>
            {user?.role === 'author' ? <NavLink to="/dashboard">Dashboard</NavLink> : null}
          </nav>

          <div className="authBox">
            {user ? (
              <>
                <span className="who">
                  {user.name} <span className="role">{user.role}</span>
                </span>
                <button className="btn secondary" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn secondary" to="/login">
                  Login
                </Link>
                <Link className="btn primary" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>

      <footer className="footer">MERN Blog Platform</footer>
    </div>
  );
}

