const fs = require('fs');
let code = fs.readFileSync('src/pages/Auxilios.tsx', 'utf8');

code = code.replace(/const \[statusMsg, setStatusMsg\] = useState<\{ type: 'success' \| 'error', text: string \} \| null>\(null\);/, 
"const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);");

code = code.replace(/statusMsg\.type === 'success' \? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'/g, 
"statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : statusMsg.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-100' : 'bg-red-50 text-red-800 border border-red-100'");

code = code.replace(/statusMsg\.type === 'success' \? <CheckCircle className="w-4 h-4 mt-0\.5 flex-shrink-0" \/> : <AlertCircle className="w-4 h-4 mt-0\.5 flex-shrink-0" \/>/g, 
"statusMsg.type === 'success' ? <CheckCircle className=\"w-4 h-4 mt-0.5 flex-shrink-0\" /> : statusMsg.type === 'info' ? <Info className=\"w-4 h-4 mt-0.5 flex-shrink-0\" /> : <AlertCircle className=\"w-4 h-4 mt-0.5 flex-shrink-0\" />");

// Wait, I need to make sure Info is imported from lucide-react if I use it.
fs.writeFileSync('src/pages/Auxilios.tsx', code);
