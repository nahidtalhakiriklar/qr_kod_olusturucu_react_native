import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mpctwxgfnrclkubowiss.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dwj1wJ3cUQdSFbfiwHzEDw_mmkCIfrx';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
