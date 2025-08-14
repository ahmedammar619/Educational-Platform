const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

async function resetDatabase() {
  console.log('Database connection config:');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT || 5432);
  console.log('Database:', process.env.DB_NAME);
  console.log('User:', process.env.DB_USER);
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Connected successfully!');
    console.log('Resetting database (dropping all tables)...');
    
    // Drop all tables and types
    const resetQuery = `
      -- Drop all tables in correct order (reverse of dependencies)
      DROP TABLE IF EXISTS activity_logs CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS support_tickets CASCADE;
      DROP TABLE IF EXISTS discount_coupons CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS invoices CASCADE;
      DROP TABLE IF EXISTS class_recordings CASCADE;
      DROP TABLE IF EXISTS zoom_meetings CASCADE;
      DROP TABLE IF EXISTS assignment_submissions CASCADE;
      DROP TABLE IF EXISTS assignments CASCADE;
      DROP TABLE IF EXISTS class_attendance CASCADE;
      DROP TABLE IF EXISTS class_enrollments CASCADE;
      DROP TABLE IF EXISTS classes CASCADE;
      DROP TABLE IF EXISTS course_content CASCADE;
      DROP TABLE IF EXISTS courses CASCADE;
      DROP TABLE IF EXISTS student_parents CASCADE;
      DROP TABLE IF EXISTS user_sessions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS age_groups CASCADE;
      DROP TABLE IF EXISTS subjects CASCADE;
      
      -- Drop custom types
      DROP TYPE IF EXISTS user_role CASCADE;
      DROP TYPE IF EXISTS user_status CASCADE;
      DROP TYPE IF EXISTS class_status CASCADE;
      DROP TYPE IF EXISTS payment_status CASCADE;
      DROP TYPE IF EXISTS invoice_status CASCADE;
      DROP TYPE IF EXISTS content_type CASCADE;
      DROP TYPE IF EXISTS ticket_status CASCADE;
      DROP TYPE IF EXISTS ticket_priority CASCADE;
      DROP TYPE IF EXISTS notification_type CASCADE;
      
      -- Drop functions
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `;
    
    await client.query(resetQuery);
    
    console.log('Database reset completed successfully!');
    console.log('All tables and types have been dropped.');
    
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;