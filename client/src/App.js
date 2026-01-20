import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostDetail from './pages/PostDetail';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import './App.css';

function RequireAuthor({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="card">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'author') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/post/:slug" element={<PostDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <RequireAuthor>
                  <Dashboard />
                </RequireAuthor>
              }
            />
            <Route
              path="/editor/:id"
              element={
                <RequireAuthor>
                  <Editor />
                </RequireAuthor>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
