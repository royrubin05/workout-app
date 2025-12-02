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

console.log('🔌 Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_EMAIL = 'roy.rubin@gmail.com';
const TEST_PASSWORD = 'password123'; // We will use a simple default password for this single-user mode

async function testConnection() {
    try {
        // 1. Check Health (optional, but good)
        // We'll just try to sign in directly.

        console.log(`🔑 Attempting login for ${TEST_EMAIL}...`);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });

        if (error) {
            console.error('❌ Login Failed:', error.message);

            // If login fails, maybe user doesn't exist? Try creating?
            // For now, just report failure.
            if (error.message.includes('Invalid login credentials')) {
                console.log('⚠️  User might not exist or password wrong. Attempting to create user...');

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: TEST_EMAIL,
                    password: TEST_PASSWORD,
                });

                if (signUpError) {
                    console.error('❌ Sign Up Failed:', signUpError.message);
                } else {
                    console.log('✅ Sign Up Successful! User created.');
                    console.log('   User ID:', signUpData.user?.id);
                    console.log('   Email:', signUpData.user?.email);
                    console.log('   ⚠️  IMPORTANT: If "Email Confirmations" are enabled in Supabase, you must confirm the email before logging in.');
                }
            }
        } else {
            console.log('✅ Login Successful!');
            console.log('   User ID:', data.user.id);
            console.log('   Email:', data.user.email);
        }

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testConnection();
