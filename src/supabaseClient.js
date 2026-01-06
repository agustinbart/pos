import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase environment variables')
  console.error('📝 Please create a .env.local file in the root directory (where package.json is) with:')
  console.error('   VITE_SUPABASE_URL=your_supabase_project_url')
  console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  console.error('')
  console.error('💡 You can get these values from your Supabase project settings:')
  console.error('   https://app.supabase.com/project/_/settings/api')
  throw new Error('Missing Supabase environment variables. Check the console for instructions.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
