#!/usr/bin/env node
/**
 * MEDISCHED CERT - Admin Account Seeder
 * Creates an admin account directly in Supabase
 * 
 * Usage: node seed-admin.cjs
 */
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configuration - change these values as needed
const ADMIN_CONFIG = {
  email: 'admin@medisched.com',
  password: 'admin123',
  first_name: 'Admin',
  last_name: 'User',
  id_number: 'ADMIN-001',
  role: 'admin'
};

// Load from environment or use defaults
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iqxfqfysjwbyylwzlfib.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('');
  console.error('Please set it before running:');
  console.error('');
  console.error('Windows (PowerShell):');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.error('  node seed-admin.cjs');
  console.error('');
  console.error('Or get it from: https://supabase.com/dashboard/project/iqxfqfysjwbyylwzlfib/settings/api');
  process.exit(1);
}

async function seedAdmin() {
  console.log('========================================');
  console.log('MEDISCHED CERT - Admin Account Seeder');
  console.log('========================================');
  console.log('');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Check if admin already exists
  console.log('🔍 Checking if admin account already exists...');
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', ADMIN_CONFIG.email)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('⚠️  Admin account already exists with email:', ADMIN_CONFIG.email);
    console.log('');
    console.log('If you want to reset the password, update it manually in Supabase.');
    return;
  }

  // Create Supabase Auth user
  console.log('🔐 Creating Supabase Auth user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_CONFIG.email,
    password: ADMIN_CONFIG.password,
    email_confirm: true
  });

  if (authError) {
    console.error('❌ Failed to create auth user:', authError.message);
    process.exit(1);
  }

  console.log('✅ Auth user created with ID:', authData.user.id);

  // Hash password for our users table
  const password_hash = await bcrypt.hash(ADMIN_CONFIG.password, 12);

  // Create user in public.users table
  console.log('📝 Creating user record in database...');
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .insert({
      auth_id: authData.user.id,
      email: ADMIN_CONFIG.email,
      id_number: ADMIN_CONFIG.id_number,
      password_hash: password_hash,
      first_name: ADMIN_CONFIG.first_name,
      last_name: ADMIN_CONFIG.last_name,
      role: ADMIN_CONFIG.role,
      active_status: 'active'
    })
    .select()
    .single();

  if (dbError) {
    console.error('❌ Failed to create user record:', dbError.message);
    // Clean up auth user if DB insert fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    process.exit(1);
  }

  console.log('✅ User record created');
  console.log('');
  console.log('========================================');
  console.log('🎉 Admin account created successfully!');
  console.log('========================================');
  console.log('');
  console.log('📧 Email:', ADMIN_CONFIG.email);
  console.log('🔑 Password:', ADMIN_CONFIG.password);
  console.log('👤 Name:', ADMIN_CONFIG.first_name, ADMIN_CONFIG.last_name);
  console.log('🆔 ID Number:', ADMIN_CONFIG.id_number);
  console.log('🛡️  Role:', ADMIN_CONFIG.role);
  console.log('');
  console.log('You can now login at: https://medisched-cert.vercel.app/login');
  console.log('');
}

seedAdmin().catch(err => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});
