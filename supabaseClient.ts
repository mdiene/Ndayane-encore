import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xwmzhvttkvbpcldhgzdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXpodnR0a3ZicGNsZGhnemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NTUzNDYsImV4cCI6MjA3OTAzMTM0Nn0.kC-EspJwE5rrYvLzLdXsFMgvGwbBW-N7FIxYh6AAyL0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);