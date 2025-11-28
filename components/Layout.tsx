import React, { useState, useEffect } from 'react';
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
  UserCircle,
  Palette,
  X
} from 'lucide-react';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  
  // DaisyUI Themes List
  const themes = [
    "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter", "dim", "nord", "sunset"
  ];
  const [currentTheme, setCurrentTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/owners', icon: Users, label: 'Propriétaires' },
    { to: '/trucks', icon: Truck, label: 'Camions' },
    { to: '/drivers', icon: UserSquare, label: 'Chauffeurs' },
    { to: '/deliveries', icon: Package, label: 'Livraisons' },
    { to: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-base-100 text-base-content overflow-hidden relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative top-0 left-0 h-full z-30
          flex flex-col border-r border-base-300 bg-base-200 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0 md:w-20'}
        `}
      >
        <div className="h-16 flex items-center justify-center border-b border-base-300 relative">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-content text-lg">M</div>
            {isSidebarOpen && <span>Mozaic</span>}
          </div>
          {/* Mobile Close Button */}
          <button 
             className="md:hidden absolute right-2 btn btn-ghost btn-sm btn-circle"
             onClick={() => setIsSidebarOpen(false)}
           >
             <X size={20} />
           </button>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) => `
                flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 overflow-hidden
                ${isActive 
                  ? 'bg-primary text-primary-content shadow-md' 
                  : 'text-base-content/70 hover:bg-base-300 hover:text-base-content'}
              `}
            >
              <item.icon size={24} className="min-w-[24px]" />
              <span className={`whitespace-nowrap font-medium transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-base-300 hidden md:block">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="btn btn-ghost w-full"
          >
            {isSidebarOpen ? '<<' : '>>'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 border-b border-base-300 bg-base-100/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden btn btn-ghost btn-circle" onClick={() => setIsSidebarOpen(true)}>
              <Menu />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="input input-bordered input-sm rounded-full pl-10 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* DaisyUI Theme Selector */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                <Palette size={18} />
                <span className="hidden sm:inline">Thème</span>
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52 max-h-96 overflow-y-auto">
                {themes.map(theme => (
                  <li key={theme}>
                    <input 
                      type="radio" 
                      name="theme-dropdown" 
                      className="theme-controller btn btn-sm btn-block btn-ghost justify-start" 
                      aria-label={theme} 
                      value={theme}
                      checked={currentTheme === theme}
                      onChange={() => setCurrentTheme(theme)}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-base-300">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-base-content/60">Logistics Manager</p>
              </div>
              <div className="avatar">
                <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <div className="w-full h-full bg-neutral flex items-center justify-center text-neutral-content">
                    <UserCircle />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-base-200/50 w-full">
          <div className="max-w-7xl mx-auto pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};