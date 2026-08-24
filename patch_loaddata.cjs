const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(
  "      setSalidaMap(sMap);\n      setIsLoading(false);\n    }\n    \n  }, [fecha]);",
  "      setSalidaMap(sMap);\n      setIsLoading(false);\n    }\n    loadData();\n  }, [fecha]);"
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);
