const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const oldReturn = `  if (mode === 'hidden') {
    return null;
  }

  const isCompact = mode === 'compact';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    \`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group relative \${
      isActive 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    } \${isCompact ? 'justify-center px-0' : ''}\`;

  return (
    <aside 
      className={\`bg-slate-900 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out flex-shrink-0 relative z-30 select-none \${
        isCompact ? 'w-16' : 'w-64'
      }\`}
    >`;

const newReturn = `  const isHidden = mode === 'hidden';
  const isCompact = mode === 'compact';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    \`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group relative \${
      isActive 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    } \${isCompact ? 'justify-center px-0' : ''}\`;

  return (
    <>
      {/* Mobile Overlay */}
      {!isHidden && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40"
          onClick={() => setMode('hidden')}
        />
      )}
      <aside 
        className={\`bg-slate-900 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out flex-shrink-0 absolute md:relative z-50 h-full select-none \${
          isCompact ? 'w-16' : 'w-64'
        } \${
          isHidden ? '-translate-x-full md:hidden' : 'translate-x-0'
        }\`}
      >`;

code = code.replace(oldReturn, newReturn);

// For mobile clicks, we should close the sidebar when a link is clicked
code = code.replace(/<NavLink\n                  to="\/([^"]+)"/g, '<NavLink\n                  onClick={() => window.innerWidth < 768 && setMode("hidden")}\n                  to="/$1"');
code = code.replace(/<NavLink to="\/([^"]+)"/g, '<NavLink onClick={() => window.innerWidth < 768 && setMode("hidden")} to="/$1"');

fs.writeFileSync('src/components/Sidebar.tsx', code);
