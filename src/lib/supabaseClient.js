// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zcvghpovhjerbuplwnar.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_GVcq6JJocZQMuoZtpIzICw_pAtLGbjE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
