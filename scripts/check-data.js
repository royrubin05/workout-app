import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_EMAIL = 'roy.rubin@gmail.com';
const TEST_PASSWORD = 'password123';

async function checkData() {
    try {
        console.log(`🔑 Logging in as ${TEST_EMAIL}...`);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });

        if (authError) {
            console.error('❌ Login Failed:', authError.message);
            return;
        }

        const userId = authData.user.id;
        console.log('✅ Login Successful! User ID:', userId);

        console.log('🔍 Fetching user_settings...');
        const { data: settingsData, error: settingsError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', userId)
            .single();

        if (settingsError) {
            console.error('❌ Failed to fetch settings:', settingsError.message);
            return;
        }

        console.log('\n📊 CURRENT SUPABASE DATA:');
        console.log('----------------------------------------');
        console.log('Equipment:         ', settingsData.equipment);
        console.log('Excluded Exercises:', settingsData.excluded_exercises);
        console.log('Include Bodyweight:', settingsData.include_bodyweight);
        console.log('Last Updated:      ', settingsData.updated_at);
        console.log('----------------------------------------');

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

checkData();
