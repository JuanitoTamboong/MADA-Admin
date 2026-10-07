import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gddeictzmngpyqgrmtsw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGVpY3R6bW5ncHlxZ3JtdHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMjkxMDMsImV4cCI6MjEwNjkwNTEwM30.qpDpaZRIyjfMmn2XKVosqBmp8vi72ntpHtk0ie45Vyc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);