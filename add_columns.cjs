const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const sql = `
  ALTER TABLE auxilios ADD COLUMN IF NOT EXISTS unidad_asistencia TEXT;
  ALTER TABLE auxilios ADD COLUMN IF NOT EXISTS hora_llegada_asistencia TEXT;
  ALTER TABLE auxilios ADD COLUMN IF NOT EXISTS hora_llegada_base TEXT;
  ALTER TABLE auxilios ADD COLUMN IF NOT EXISTS hora_llegada_auxiliada TEXT;
  ALTER TABLE auxilios ADD COLUMN IF NOT EXISTS observaciones TEXT;
  `;
  const { data, error } = await sb.rpc('execute_sql', { sql });
  console.log('Result:', data, error);
}
run();
