
import { createClient } from '@supabase/supabase-js';

// Hardcoded from src/services/supabase.ts
const supabaseUrl = 'https://abtxrknyybuxsnepnvmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidHhya255eWJ1eHNuZXBudm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDU2MTYsImV4cCI6MjA4MDE4MTYxNn0.EpIDZbCulRyuCh4M2Jw9MQQ3GbmxAqXROghVZleqST0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkApiKey() {
    console.log("Checking App Config...");
    const { data: appConfig, error } = await supabase
        .from('app_config')
        .select('*')
        .eq('id', 1)
        .single();

    if (error && error.code === 'PGRST116') {
        console.error("❌ app_config row (id=1) is MISSING. This is a configuration error.");
        console.log("Attempting to fix by creating the row (with empty key)...");

        const { error: insertError } = await supabase
            .from('app_config')
            .insert([{ id: 1, openai_api_key: '', maintenance_mode: false }]);

        if (insertError) {
            console.error("Failed to insert app_config row:", insertError);
        } else {
            console.log("✅ Created app_config row. Please check Dashboard to set Global Key.");
        }
    } else if (appConfig) {
        const key = appConfig.openai_api_key;
        if (key && !key.startsWith('sk-')) {
            console.error(`❌ FAILURE: Global Key exists but has invalid format: ${key.substring(0, 5)}...`);
        } else if (key) {
            console.log("✅ Global Key is valid (sk- format).");
        } else {
            console.log("ℹ️ Global Key is empty.");
        }
    }

    console.log("\nChecking User Settings for bad keys...");
    const { data: users, error: userError } = await supabase
        .from('user_settings')
        .select('id, openai_api_key');

    if (userError) {
        console.error("Error fetching user_settings:", userError);
        return;
    }

    if (users && users.length > 0) {
        let foundBadKey = false;
        users.forEach(u => {
            if (u.openai_api_key) {
                if (!u.openai_api_key.startsWith('sk-')) {
                    console.error(`❌ Found INVALID Key for user ${u.id}: ${u.openai_api_key}`);
                    foundBadKey = true;
                } else {
                    console.log(`✅ User ${u.id} has valid key.`);
                }
            } else {
                console.log(`ℹ️ User ${u.id} has no key.`);
            }
        });

        if (!foundBadKey) {
            console.log("No invalid keys found in user_settings.");
        }
    } else {
        console.log("No user settings found.");
    }
}

checkApiKey();
