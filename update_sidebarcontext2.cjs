const fs = require('fs');
let code = fs.readFileSync('src/context/SidebarContext.tsx', 'utf8');

const oldToggle = `  const toggleSidebar = () => {
    setMode((prev) => {
      if (prev === 'expanded') return 'compact';
      if (prev === 'compact') return 'hidden';
      return 'expanded';
    });
  };`;

const newToggle = `  const toggleSidebar = () => {
    setMode((prev) => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        return prev === 'hidden' ? 'expanded' : 'hidden';
      }
      if (prev === 'expanded') return 'compact';
      if (prev === 'compact') return 'hidden';
      return 'expanded';
    });
  };`;

code = code.replace(oldToggle, newToggle);
fs.writeFileSync('src/context/SidebarContext.tsx', code);
