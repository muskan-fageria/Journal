const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aogfbetxmzsjjdhbured.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2ZiZXR4bXpzampkaGJ1cmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTQyNDgsImV4cCI6MjA4OTA5MDI0OH0.OedI5IJQuUT-qB4INo2EH2yALrkoF3xqRMviMi9ESnM';
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AUTO_EMAIL = 'admin@journal.local';
const AUTO_PASS = 'admin123456';

async function test() {
    console.log("Trying to sign in...");
    let { data: signInData, error: signInError } = await db.auth.signInWithPassword({ email: AUTO_EMAIL, password: AUTO_PASS });
    if (signInError) {
        console.log("Sign in failed:", signInError.message);
        console.log("Trying to sign up...");
        const { data: signUpData, error: signUpError } = await db.auth.signUp({ email: AUTO_EMAIL, password: AUTO_PASS });
        if (signUpError) {
            console.log("Sign up failed:", signUpError.message);
        } else {
            console.log("Sign up success:", signUpData);
        }
    } else {
        console.log("Sign in success:", signInData.user.id);
    }
}

test();
