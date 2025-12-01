import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// --- CONFIG ---
const SUPABASE_URL = 'https://abtxrknyybuxsnepnvmy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidHhya255eWJ1eHNuZXBudm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDU2MTYsImV4cCI6MjA4MDE4MTYxNn0.EpIDZbCulRyuCh4M2Jw9MQQ3GbmxAqXROghVZleqST0';
const EMAIL = 'admin@fitgen.app';
const PASSWORD = 'D*UWQufY_h.w8_2';

const FREE_DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// --- MAIN ---
async function run() {
    console.log('--- STARTING VERIFICATION ---');

    // 1. Verify Images & Data
    console.log('\n1. Checking Exercise Data Source...');
    try {
        const res = await fetch(FREE_DB_URL);
        const data = await res.json();
        console.log(`   Fetched ${data.length} exercises.`);

        if (data.length > 0) {
            const ex = data[0];
            console.log(`   Sample: ${ex.name}`);
            if (ex.images && ex.images.length > 0) {
                const imgUrl = `${IMAGE_BASE_URL}${ex.images[0]}`;
                console.log(`   Generated Image URL: ${imgUrl}`);

                // Test Image URL
                const imgRes = await fetch(imgUrl);
                console.log(`   Image URL Status: ${imgRes.status} ${imgRes.statusText}`);
            } else {
                console.log('   WARNING: No images in sample exercise.');
            }
        }
    } catch (e) {
        console.error('   FAILED to fetch exercises:', e.message);
    }

    // 2. Verify Supabase
    console.log('\n2. Checking Supabase Connection...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Auth
    console.log('   Attempting Login...');
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASSWORD
    });

    if (loginError) {
        console.error('   LOGIN FAILED:', loginError.message);
        // Try Sign Up
        console.log('   Attempting Sign Up...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: EMAIL,
            password: PASSWORD
        });
        if (signUpError) {
            console.error('   SIGN UP FAILED:', signUpError.message);
            return;
        }
        console.log('   Sign Up Successful (Session might be null if email confirm needed).');
    } else {
        console.log('   Login Successful!');
    }

    // DB Access
    const user = session?.user || (await supabase.auth.getUser()).data.user;
    if (user) {
        console.log(`   User ID: ${user.id}`);

        console.log('   Checking "user_settings" table...');
        const { data: settings, error: dbError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', user.id);

        if (dbError) {
            console.error('   DB READ FAILED:', dbError.message);
            console.log('   -> This usually means the TABLE DOES NOT EXIST or RLS is blocking.');
        } else {
            console.log('   DB Read Success. Rows:', settings.length);

            // Try Write
            console.log('   Attempting DB Write...');
            const { error: writeError } = await supabase
                .from('user_settings')
                .upsert({ id: user.id, equipment: 'Dumbbells, Bench' });

            if (writeError) {
                console.error('   DB WRITE FAILED:', writeError.message);
            } else {
                console.log('   DB Write Success!');
            }
        }
    } else {
        console.log('   No active session to test DB.');
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

run();
