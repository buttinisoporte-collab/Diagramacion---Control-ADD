import React from 'react';

export default function Header({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {subtitle && (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded border border-blue-100 uppercase tracking-tight">
            {subtitle}
          </span>
        )}
      </div>
      <div className="flex space-x-3">
        {children}
      </div>
    </header>
  );
}
