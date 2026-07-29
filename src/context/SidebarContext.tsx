import React, { createContext, useContext, useState, useEffect } from 'react';

export type SidebarMode = 'expanded' | 'compact' | 'hidden';

interface SidebarContextType {
  mode: SidebarMode;
  setMode: (mode: SidebarMode) => void;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  isHidden: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<SidebarMode>(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return 'hidden';
    
    const saved = localStorage.getItem('sidebar_mode');
    if (saved === 'expanded' || saved === 'compact' || saved === 'hidden') {
      return saved;
    }
    return 'expanded';
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setMode(prev => prev === 'compact' ? 'hidden' : prev);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar_mode', mode);
  }, [mode]);

  // Global keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setMode((prev) => {
          if (prev === 'expanded') return 'compact';
          if (prev === 'compact') return 'hidden';
          return 'expanded';
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setMode((prev) => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        return prev === 'hidden' ? 'expanded' : 'hidden';
      }
      if (prev === 'expanded') return 'compact';
      if (prev === 'compact') return 'hidden';
      return 'expanded';
    });
  };

  const isCollapsed = mode !== 'expanded';
  const isHidden = mode === 'hidden';

  return (
    <SidebarContext.Provider value={{ mode, setMode, toggleSidebar, isCollapsed, isHidden }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return {
      mode: 'expanded' as SidebarMode,
      setMode: () => {},
      toggleSidebar: () => {},
      isCollapsed: false,
      isHidden: false,
    };
  }
  return context;
}
