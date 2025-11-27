import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  UserSquare, 
  Package, 
  Settings, 
  Menu, 
  Search, 
  Sun, 
  Moon,
  UserCircle
} from 'lucide-react';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/owners', icon: Users, label: 'Propriétaires' },
    { to: '/trucks', icon: Truck, label: 'Camions' },
    { to: '/drivers', icon: UserSquare, label: 'Chauffeurs' },
    { to: '/deliveries', icon: Package, label: 'Livraisons' },
    { to: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } hidden md:flex flex-col border-r border-white/10 bg-slate-900/50 backdrop-blur-md transition-all duration-300 z-20`}
      >
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-500">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">M</div>
            {isSidebarOpen && <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">Mozaic</span>}
          </div>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <item.icon size={24} className="min-w-[24px]" />
              {isSidebarOpen && <span className="whitespace-nowrap font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {isSidebarOpen ? '<<' : '>>'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/10 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-400" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="bg-slate-950/50 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-yellow-400 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">Admin</p>
                <p className="text-xs text-slate-400">Logistics Manager</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center shadow-lg">
                <UserCircle className="text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-auto p-6 bg-dots-pattern">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Drawer (Simplified for brevity) */}
      {/* Actual logic would overlay here for mobile */}
    </div>
  );
};