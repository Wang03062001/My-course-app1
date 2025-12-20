'use client';

import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ExposeSupabase() {
  useEffect(() => {
    // Chỉ bật khi debug (tùy bạn)
    window.supabase = supabase;
  }, []);

  return null;
}
