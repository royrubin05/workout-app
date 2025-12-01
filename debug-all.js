import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// --- CONFIG ---
const SUPABASE_URL = 'https://abtxrknyybuxsnepnvmy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidHhya255eWJ1eHNuZXBudm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDU2MTYsImV4cCI6MjA4MDE4MTYxNn0.EpIDZbCulRyuCh4M2Jw9MQQ3GbmxAqXROghVZleqST0';
const EMAIL = 'roy.rubin@gmail.com';
const PASSWORD = 'D*UWQufY_h.w8_2';

const FREE_DB_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

// --- LOGIC COPIED FROM exerciseDB.ts ---
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const normalizeEquipment = (eq) => {
    if (!eq) return 'Bodyweight';
    if (eq === 'body only') return 'Bodyweight';
    return capitalize(eq);
};

const mapTargetToCategory = (muscle, category) => {
    const pushMuscles = ['chest', 'shoulders', 'triceps'];
    const pullMuscles = ['lats', 'middle back', 'lower back', 'biceps', 'traps', 'forearms'];
    const legMuscles = ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'];
    const coreMuscles = ['abdominals'];
    const cardio = ['cardio'];

    if (pushMuscles.includes(muscle)) return 'Push';
    if (pullMuscles.includes(muscle)) return 'Pull';
    if (legMuscles.includes(muscle)) return 'Legs';
    if (coreMuscles.includes(muscle)) return 'Core';
    if (category === 'cardio') return 'Cardio';

    return 'Full Body';
};

const mapApiToInternal = (apiData) => {
    return apiData.map(ex => ({
        id: ex.id,
        name: ex.name,
        equipment: normalizeEquipment(ex.equipment),
        category: mapTargetToCategory(ex.primaryMuscles[0] || '', ex.category),
        muscleGroup: ex.primaryMuscles[0] ? capitalize(ex.primaryMuscles[0]) : 'Full Body',
        gifUrl: ex.images && ex.images.length > 0 ? `${IMAGE_BASE_URL}${ex.images[0]}` : undefined
    }));
};

// --- MAIN ---
async function run() {
    console.log('--- DEBUG START ---');

    // 1. TEST API & MAPPING
    console.log('\n1. Testing API Fetch & Mapping...');
    try {
        const res = await fetch(FREE_DB_URL);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const rawData = await res.json();
        console.log(`   Fetched ${rawData.length} raw items.`);

        // Simulate Minification (from exerciseDB.ts)
        const minifiedData = rawData.map((ex) => ({
            id: ex.id,
            name: ex.name,
            equipment: ex.equipment,
            primaryMuscles: ex.primaryMuscles,
            category: ex.category,
            images: ex.images
        }));

        // Simulate Mapping
        const internalData = mapApiToInternal(minifiedData);
        console.log(`   Mapped ${internalData.length} items.`);

        // Check first 3 items for gifUrl
        for (let i = 0; i < 3; i++) {
            console.log(`   [${i}] ${internalData[i].name}`);
            console.log(`       Raw Images: ${JSON.stringify(minifiedData[i].images)}`);
            console.log(`       Mapped URL: ${internalData[i].gifUrl}`);
            if (!internalData[i].gifUrl) console.error('       ERROR: gifUrl is MISSING');
        }
    } catch (e) {
        console.error('   API TEST FAILED:', e);
    }

    // 2. TEST SUPABASE AUTH & WRITE
    console.log('\n2. Testing Supabase Auth & Write...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Try Login
    console.log('   Attempting Login...');
    let { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASSWORD
    });

    if (loginError) {
        console.warn('   Login Failed:', loginError.message);
        console.log('   Attempting Sign Up...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: EMAIL,
            password: PASSWORD
        });

        if (signUpError) {
            console.error('   SIGN UP FAILED:', signUpError.message);
            console.log('   -> If "Signups not allowed", enable "Enable email signups" in Supabase.');
            return;
        }
        console.log('   Sign Up Success. Session:', signUpData.session ? 'Created' : 'Pending Email Confirm');
        session = signUpData.session;
    } else {
        console.log('   Login Success!');
    }

    if (session) {
        console.log(`   User ID: ${session.user.id}`);

        // Try Write
        console.log('   Attempting Write to user_settings...');
        const { error: writeError } = await supabase
            .from('user_settings')
            .upsert({
                id: session.user.id,
                equipment: 'Debug Dumbbells',
                updated_at: new Date().toISOString()
            });

        if (writeError) {
            console.error('   WRITE FAILED:', writeError.message);
            console.log('   -> Check RLS Policies.');
        } else {
            console.log('   WRITE SUCCESS! Data saved.');
        }
    } else {
        console.error('   NO SESSION. Cannot test write.');
        console.log('   -> If Sign Up was success but no session, "Confirm Email" is likely ON.');
    }

    console.log('\n--- DEBUG END ---');
}

run();
