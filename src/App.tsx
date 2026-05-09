/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BusinessProfile from './pages/BusinessProfile';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AddBusiness from './pages/AddBusiness';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBusinesses from './pages/admin/AdminBusinesses';
import Favorites from './pages/Favorites';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function App() {
  return (
    <div className="flex h-screen w-full bg-dark-bg text-neutral-200 overflow-hidden font-sans">
      <aside className="hidden md:flex w-64 border-r border-dark-border flex-col h-full shrink-0">
        <Sidebar />
      </aside>
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <Header />
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/biz/:id" element={<BusinessProfile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/add-business" element={<AddBusiness />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/businesses" element={<AdminBusinesses />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
