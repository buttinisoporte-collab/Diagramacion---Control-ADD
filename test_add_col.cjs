const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.rpc('execute_sql', { query: 'ALTER TABLE auxilios ADD COLUMN IF NOT EXISTS hora_llegada_base text;' });
  console.log(error || data);
}
test();
