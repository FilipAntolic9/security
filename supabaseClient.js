require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://pkbbpailgyurmlabprxi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrYmJwYWlsZ3l1cm1sYWJwcnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEyNjU2MDYsImV4cCI6MjA0Njg0MTYwNn0.uPnBSl35aTEs0IwiQXJpJ6b43ZiZIeIDkRavVzpMb2k";
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
