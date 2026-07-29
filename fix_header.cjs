const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

const imports = `import React from 'react';
import { Bell, Search, PanelLeftOpen, Menu } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';`;

code = code.replace(`import React from 'react';\nimport { Bell, Search, PanelLeftOpen } from 'lucide-react';\nimport { useSidebar } from '../context/SidebarContext';`, imports);
if (!code.includes('Menu')) {
  code = code.replace(`import { Bell, Search, PanelLeftOpen } from 'lucide-react';`, `import { Bell, Search, PanelLeftOpen, Menu } from 'lucide-react';`);
}

const oldLeftHeader = `<div className="flex items-center space-x-4">
        {isHidden && (
          <button
            onClick={() => setMode('expanded')}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Mostrar menú"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}
        <div>`;

const newLeftHeader = `<div className="flex items-center space-x-3 md:space-x-4">
        <button
          onClick={() => setMode(mode === 'hidden' ? 'expanded' : 'hidden')}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          title="Alternar menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        {isHidden && (
          <button
            onClick={() => setMode('expanded')}
            className="hidden md:block p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Mostrar menú"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}
        <div>`;

code = code.replace(oldLeftHeader, newLeftHeader);
fs.writeFileSync('src/components/Header.tsx', code);
