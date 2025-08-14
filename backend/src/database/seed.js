const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

async function seedDatabase() {
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
    console.log('Seeding database with initial data...');
    
    // Hash password for demo users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Insert subjects
    await client.query(`
      INSERT INTO subjects (name, description, color_code) VALUES
      ('Quran Memorization', 'Memorization and recitation of the Holy Quran', '#10B981'),
      ('Arabic Language', 'Learning Arabic reading, writing, and comprehension', '#3B82F6'),
      ('Islamic Studies', 'Islamic history, principles, and teachings', '#8B5CF6'),
      ('Tajweed', 'Proper pronunciation and recitation rules', '#F59E0B')
      ON CONFLICT DO NOTHING;
    `);
    
    // Insert age groups
    await client.query(`
      INSERT INTO age_groups (name, min_age, max_age, description) VALUES
      ('Little Stars', 4, 6, 'Early childhood Islamic education'),
      ('Young Learners', 7, 9, 'Elementary level Islamic studies'),
      ('Junior Students', 10, 12, 'Intermediate level with advanced memorization'),
      ('Senior Students', 13, 16, 'Advanced Islamic studies and leadership')
      ON CONFLICT DO NOTHING;
    `);
    
    // Insert demo admin user
    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified) VALUES
      ('admin@baraemalNoor.com', $1, 'System', 'Administrator', 'admin', 'active', true)
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);
    
    // Insert demo teacher
    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, status, email_verified) VALUES
      ('teacher@baraemalNoor.com', $1, 'Ahmad', 'Al-Mahmoud', '+1234567890', 'teacher', 'active', true)
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);
    
    // Insert demo parent
    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, status, email_verified) VALUES
      ('parent@baraemalNoor.com', $1, 'Fatima', 'Al-Zahra', '+1234567891', 'parent', 'active', true)
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);
    
    // Insert demo students
    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, date_of_birth, role, status, temporary_access_code, access_code_expires_at) VALUES
      ('student1@baraemalNoor.com', $1, 'Ahmed', 'Ali', '2015-03-15', 'student', 'active', 'ABC123', NOW() + INTERVAL '30 days'),
      ('student2@baraemalNoor.com', $1, 'Aisha', 'Hassan', '2013-07-22', 'student', 'active', 'DEF456', NOW() + INTERVAL '30 days')
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);
    
    // Get user IDs for relationships
    const teacherResult = await client.query("SELECT id FROM users WHERE email = 'teacher@baraemalNoor.com'");
    const parentResult = await client.query("SELECT id FROM users WHERE email = 'parent@baraemalNoor.com'");
    const student1Result = await client.query("SELECT id FROM users WHERE email = 'student1@baraemalNoor.com'");
    const student2Result = await client.query("SELECT id FROM users WHERE email = 'student2@baraemalNoor.com'");
    
    if (teacherResult.rows.length > 0 && parentResult.rows.length > 0 && 
        student1Result.rows.length > 0 && student2Result.rows.length > 0) {
      
      const teacherId = teacherResult.rows[0].id;
      const parentId = parentResult.rows[0].id;
      const student1Id = student1Result.rows[0].id;
      const student2Id = student2Result.rows[0].id;
      
      // Create parent-student relationships
      await client.query(`
        INSERT INTO student_parents (student_id, parent_id, relationship, is_primary) VALUES
        ($1, $2, 'father', true),
        ($3, $2, 'father', true)
        ON CONFLICT (student_id, parent_id) DO NOTHING;
      `, [student1Id, parentId, student2Id]);
      
      // Get subject and age group IDs
      const subjectResult = await client.query("SELECT id FROM subjects WHERE name = 'Quran Memorization'");
      const ageGroupResult = await client.query("SELECT id FROM age_groups WHERE name = 'Young Learners'");
      
      if (subjectResult.rows.length > 0 && ageGroupResult.rows.length > 0) {
        const subjectId = subjectResult.rows[0].id;
        const ageGroupId = ageGroupResult.rows[0].id;
        
        // Create demo course
        await client.query(`
          INSERT INTO courses (title, description, subject_id, age_group_id, teacher_id, price, max_students) VALUES
          ('Quran Memorization - Level 1', 'Introduction to Quran memorization for young learners', $1, $2, $3, 150.00, 15)
          ON CONFLICT DO NOTHING;
        `, [subjectId, ageGroupId, teacherId]);
        
        // Get course ID
        const courseResult = await client.query("SELECT id FROM courses WHERE title = 'Quran Memorization - Level 1'");
        
        if (courseResult.rows.length > 0) {
          const courseId = courseResult.rows[0].id;
          
          // Create demo class
          await client.query(`
            INSERT INTO classes (course_id, teacher_id, title, description, scheduled_start, scheduled_end, max_students) VALUES
            ($1, $2, 'Morning Quran Class', 'Daily Quran memorization session', 
             NOW() + INTERVAL '1 day' + TIME '10:00:00', 
             NOW() + INTERVAL '1 day' + TIME '11:00:00', 15)
            ON CONFLICT DO NOTHING;
          `, [courseId, teacherId]);
          
          // Create demo discount coupon
          await client.query(`
            INSERT INTO discount_coupons (code, description, discount_type, discount_value, valid_from, valid_until, created_by) VALUES
            ('WELCOME10', '10% discount for new students', 'percentage', 10.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $1)
            ON CONFLICT (code) DO NOTHING;
          `, [teacherId]);
        }
      }
    }
    
    console.log('Database seeded successfully!');
    console.log('Demo accounts created:');
    console.log('- Admin: admin@baraemalNoor.com / password123');
    console.log('- Teacher: teacher@baraemalNoor.com / password123');
    console.log('- Parent: parent@baraemalNoor.com / password123');
    console.log('- Students: student1@baraemalNoor.com, student2@baraemalNoor.com / password123');
    
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;