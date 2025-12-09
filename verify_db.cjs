
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://abtxrknyybuxsnepnvmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidHhya255eWJ1eHNuZXBudm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDU2MTYsImV4cCI6MjA4MDE4MTYxNn0.EpIDZbCulRyuCh4M2Jw9MQQ3GbmxAqXROghVZleqST0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
    try {
        console.log("Logging in...");
        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
            email: 'roy.rubin@gmail.com',
            password: 'password123'
        });

        if (authError) {
            // If login fails, maybe already logged in or session issue? 
            // Try to just get user from session if persisted? 
            // Actually, just try anon query if RLS allows? Usually requires auth.
            console.error("Auth Error:", authError.message);
            return;
        }

        console.log("Logged in as:", user.id);

        console.log("Querying user_settings for 'user_equipment_profile'...");
        const { data, error } = await supabase
            .from('user_settings')
            .select('user_equipment_profile, available_exercise_names')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error("Query Error:", error.message);
            console.error("Details:", error.details);
            console.error("Hint:", error.hint);
            if (error.code === 'PGRST301') {
                console.error("Column likely missing! Did you run the SQL migration?");
            }
        } else {
            console.log("SUCCESS! Retrieved Record:");
            console.log("Profile:", data.user_equipment_profile);
            console.log("Whitelist Count:", data.available_exercise_names ? data.available_exercise_names.length : 0);
        }

    } catch (e) {
        console.error("Script Error:", e);
    }
}

runTest();
