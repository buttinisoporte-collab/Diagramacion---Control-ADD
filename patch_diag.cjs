const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');
const special = fs.readFileSync('special_assignments.tsx', 'utf8');

const target = `            </div>
          )}
        </div>
      </div>

      {/* Copy Modal */}`;
      
code = code.replace(target, `            </div>\n          )}\n        </div>\n      </div>\n\n` + special + `\n\n      {/* Copy Modal */}`);

if (!code.includes('import {') || !code.includes('Car')) {
    code = code.replace("import {", "import { Car,");
}

fs.writeFileSync('src/pages/Diagramacion.tsx', code);
