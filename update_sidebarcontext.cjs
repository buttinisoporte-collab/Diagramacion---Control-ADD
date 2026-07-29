const fs = require('fs');
let code = fs.readFileSync('src/context/SidebarContext.tsx', 'utf8');

const oldState = `const [mode, setMode] = useState<SidebarMode>(() => {
    const saved = localStorage.getItem('sidebar_mode');
    if (saved === 'expanded' || saved === 'compact' || saved === 'hidden') {
      return saved;
    }
    return 'expanded';
  });`;

const newState = `const [mode, setMode] = useState<SidebarMode>(() => {
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
  }, []);`;

code = code.replace(oldState, newState);
fs.writeFileSync('src/context/SidebarContext.tsx', code);
