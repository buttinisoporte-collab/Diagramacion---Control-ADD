const fs = require('fs');
let code = fs.readFileSync('src/pages/ControlGarita.tsx', 'utf8');

code = code.replace(
  `          {activeTab === 'salidas' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-6 overflow-auto">`,
  `          {activeTab === 'salidas' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-6">`
);

code = code.replace(
  `          {activeTab === 'llegadas' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-6 overflow-auto">`,
  `          {activeTab === 'llegadas' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-6">`
);

fs.writeFileSync('src/pages/ControlGarita.tsx', code);
console.log("Successfully removed overflow-auto from outer tab containers");
