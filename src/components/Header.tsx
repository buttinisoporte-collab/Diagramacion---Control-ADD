import React from 'react';
import { PanelLeft, PanelLeftClose, PanelLeftOpen, Menu } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

export default function Header({ 
  title, 
  subtitle, 
  children 
}: { 
  title: string; 
  subtitle?: string; 
  children?: React.ReactNode 
}) {
  const { mode, toggleSidebar, setMode } = useSidebar();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 shadow-2xs">
      <div className="flex items-center space-x-3">
        {/* Toggle Sidebar Button */}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
            mode === 'hidden'
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              : mode === 'compact'
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title={
            mode === 'expanded'
              ? "Contraer menú a íconos (Ctrl+B)"
              : mode === 'compact'
              ? "Ocultar menú lateral (Ctrl+B)"
              : "Mostrar menú lateral (Ctrl+B)"
          }
        >
          {mode === 'expanded' ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : mode === 'compact' ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Header Titles */}
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
          {subtitle && (
            <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded border border-blue-100 uppercase tracking-tight">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Action Controls / Children */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {children}
      </div>
    </header>
  );
}
