import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import type { Notification, User } from '../types';

interface Props {
  currentUser: User;
  onLogout: () => void;
}

const Layout: React.FC<Props> = ({ currentUser, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const loadNotifs = () => {
      const stored = localStorage.getItem('bt_v4_notifications');
      if (stored) {
        const all: Notification[] = JSON.parse(stored);
        setNotifications(all.filter(n => n.targetUserId === currentUser.id));
      }
    };

    loadNotifs();
    const interval = setInterval(loadNotifs, 3000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = () => {
    const stored = localStorage.getItem('bt_v4_notifications');
    if (stored) {
      const all: Notification[] = JSON.parse(stored);
      const updated = all.map(n =>
        n.targetUserId === currentUser.id
          ? { ...n, isRead: true }
          : n
      );

      localStorage.setItem('bt_v4_notifications', JSON.stringify(updated));
      setNotifications(
        notifications.map(n => ({ ...n, isRead: true }))
      );
    }

    setIsNotifOpen(!isNotifOpen);
  };

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      to: 'tasks',
      label: 'Tindak Lanjut',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
            M9 5a2 2 0 002 2h2a2 2 0 002-2
            M9 5a2 2 0 012-2h2a2 2 0 012 2
            m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    }
  ];

  if (currentUser.role === 'SECRETARY') {
    navItems.push({
      to: 'ai-noted',
      label: 'Notulensi BOD',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
            m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    });
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-72 bg-slate-900 text-white flex-shrink-0 flex flex-col fixed h-full z-40 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center font-black text-xl italic shadow-lg">
              TM
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-white">
                TelkoMedika
              </h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                Board of Directors
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all
                ${isActive
                  ? 'bg-blue-600 text-white shadow-xl translate-x-1'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              {item.icon}
              <span className="font-bold text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 p-3 mb-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-slate-700 overflow-hidden border border-slate-600">
              <img
                src={
                  currentUser.photoUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.avatar_seed}`
                }
                className="w-full h-full object-cover"
                alt={currentUser.name}
              />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[11px] font-black truncate text-white">
                {currentUser.name}
              </p>
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                {currentUser.division || currentUser.role}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-3 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            Logout System
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col w-full">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 lg:px-10 justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-lg bg-slate-50 text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Watchlist BOD Concern</p>
              <h2 className="font-black text-slate-800 text-sm lg:text-base tracking-tight">Watchlist BOD Concern</h2>
            </div>
          </div>
          <div className="flex items-center gap-4 relative">
             <button onClick={markAsRead} className="relative p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all text-slate-600 border border-slate-100 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">{unreadCount}</span>}
             </button>

             {isNotifOpen && (
               <div className="absolute top-16 right-0 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 p-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 ring-4 ring-slate-900/5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-2 border-b border-slate-50 mb-3">Mention Alerts</h4>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className={`p-4 rounded-2xl border transition-all ${n.isRead ? 'bg-white border-slate-100' : 'bg-blue-50/50 border-blue-100'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <img 
                            src={n.fromUser.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.fromUser.avatar_seed}`} 
                            className="w-6 h-6 rounded-lg shadow-sm" 
                            alt=""
                          />
                          <span className="text-[10px] font-black text-slate-900">{n.fromUser.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight">Menyebut Anda di: <span className="font-bold text-blue-700">{n.taskTitle}</span></p>
                        <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase">{new Date(n.createdAt).toLocaleTimeString()} • Board Alert</p>
                      </div>
                    )) : (
                      <p className="text-center py-12 text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No Active Mentions</p>
                    )}
                  </div>
               </div>
             )}
          </div>
        </header>

        <div className="p-4 lg:p-10 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;