import { AppDataSource } from '../data-source';
import { User } from '../modules/users/entities/user.entity';
import { Parent } from '../modules/parents/entities/parent.entity';
import { Student } from '../modules/students/entities/student.entity';
import { Teacher } from '../modules/teachers/entities/teacher.entity';
import * as bcrypt from 'bcryptjs';

// Mock data from frontend
const mockUsers = [
  {
    firstName: 'Ahmed',
    lastName: 'Al-Rashid',
    email: 'ahmed.alrashid@example.com',
    role: 'admin',
    phone: '+966501234567',
  },
  {
    firstName: 'Fatima',
    lastName: 'Al-Zahra',
    email: 'fatima.alzahra@example.com',
    role: 'teacher',
    phone: '+966502345678',
  },
  {
    firstName: 'Omar',
    lastName: 'Al-Hassan',
    email: 'omar.alhassan@example.com',
    role: 'parent',
    phone: '+966503456789',
  },
  {
    firstName: 'Aisha',
    lastName: 'Al-Mahmoud',
    email: 'aisha.almahmoud@example.com',
    role: 'student',
    phone: '+966504567890',
    birthDate: '2010-05-15',
    parentId: null, // Will be set after parent creation
  },
  {
    firstName: 'Yusuf',
    lastName: 'Al-Khalil',
    email: 'yusuf.alkhalil@example.com',
    role: 'teacher',
    phone: '+966505678901',
  },
  {
    firstName: 'Hassan',
    lastName: 'Al-Rahman',
    email: 'hassan.alrahman@example.com',
    role: 'student',
    phone: '+966506789012',
    birthDate: '2012-08-20',
    parentId: null, // Will be set after parent creation
  },
  {
    firstName: 'Layla',
    lastName: 'Al-Sabah',
    email: 'layla.alsabah@example.com',
    role: 'parent',
    phone: '+966507890123',
  },
  {
    firstName: 'Zainab',
    lastName: 'Al-Fatima',
    email: 'zainab.alfatima@example.com',
    role: 'student',
    phone: '+966508901234',
    birthDate: '2011-03-10',
    parentId: null, // Will be set after parent creation
  }
];

async function seedDatabase() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Get repositories
    const userRepository = AppDataSource.getRepository(User);
    const parentRepository = AppDataSource.getRepository(Parent);
    const studentRepository = AppDataSource.getRepository(Student);
    const teacherRepository = AppDataSource.getRepository(Teacher);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    // Use raw SQL to clear tables in correct order due to foreign key constraints
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      await queryRunner.query('TRUNCATE TABLE "students" CASCADE');
      await queryRunner.query('TRUNCATE TABLE "parents" CASCADE');
      await queryRunner.query('TRUNCATE TABLE "teachers" CASCADE');
      await queryRunner.query('TRUNCATE TABLE "users" CASCADE');
      await queryRunner.commitTransaction();
      console.log('✅ Existing data cleared');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Create users first
    console.log('👥 Creating users...');
    const createdUsers: { [key: string]: User } = {};
    
    for (const mockUser of mockUsers) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = userRepository.create({
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        passwordHash: hashedPassword,
        phone: mockUser.phone,
        role: mockUser.role as any,
      });

      const savedUser = await userRepository.save(user);
      createdUsers[mockUser.email] = savedUser;
      console.log(`✅ Created user: ${savedUser.firstName} ${savedUser.lastName} (${savedUser.role})`);
    }

    // Create parents
    console.log('👨‍👩‍👧‍👦 Creating parents...');
    const createdParents: { [key: string]: Parent } = {};
    
    for (const mockUser of mockUsers.filter(u => u.role === 'parent')) {
      const user = createdUsers[mockUser.email];
      
      const parent = parentRepository.create({
        id: user.id,
        studentIds: [],
      });

      const savedParent = await parentRepository.save(parent);
      createdParents[mockUser.email] = savedParent;
      console.log(`✅ Created parent: ${user.firstName} ${user.lastName}`);
    }

    // Create students
    console.log('🎓 Creating students...');
    const createdStudents: { [key: string]: Student } = {};
    
    for (const mockUser of mockUsers.filter(u => u.role === 'student')) {
      const user = createdUsers[mockUser.email];
      
      const student = studentRepository.create({
        id: user.id,
        birthDate: new Date(mockUser.birthDate!),
        parentId: null, // Will be linked later
      });

      const savedStudent = await studentRepository.save(student);
      createdStudents[mockUser.email] = savedStudent;
      console.log(`✅ Created student: ${user.firstName} ${user.lastName}`);
    }

    // Create teachers
    console.log('👨‍🏫 Creating teachers...');
    for (const mockUser of mockUsers.filter(u => u.role === 'teacher')) {
      const user = createdUsers[mockUser.email];
      
      const teacher = teacherRepository.create({
        id: user.id,
        courses: [],
      });

      await teacherRepository.save(teacher);
      console.log(`✅ Created teacher: ${user.firstName} ${user.lastName}`);
    }

    // Link students to parents (based on mock data relationships)
    console.log('🔗 Linking students to parents...');
    
    // Link Aisha to Omar (her father)
    const aishaStudent = createdStudents['aisha.almahmoud@example.com'];
    const omarParent = createdParents['omar.alhassan@example.com'];
    if (aishaStudent && omarParent) {
      aishaStudent.parentId = omarParent.id;
      await studentRepository.save(aishaStudent);
      
      // Update parent's studentIds array
      omarParent.studentIds = [aishaStudent.id];
      await parentRepository.save(omarParent);
      console.log('✅ Linked Aisha to Omar (father)');
    }

    // Link Hassan to Omar (his father too - assuming they're siblings)
    const hassanStudent = createdStudents['hassan.alrahman@example.com'];
    if (hassanStudent && omarParent) {
      hassanStudent.parentId = omarParent.id;
      await studentRepository.save(hassanStudent);
      
      // Update parent's studentIds array
      omarParent.studentIds = [aishaStudent.id, hassanStudent.id];
      await parentRepository.save(omarParent);
      console.log('✅ Linked Hassan to Omar (father)');
    }

    // Link Zainab to Layla (her mother)
    const zainabStudent = createdStudents['zainab.alfatima@example.com'];
    const laylaParent = createdParents['layla.alsabah@example.com'];
    if (zainabStudent && laylaParent) {
      zainabStudent.parentId = laylaParent.id;
      await studentRepository.save(zainabStudent);
      
      // Update parent's studentIds array
      laylaParent.studentIds = [zainabStudent.id];
      await parentRepository.save(laylaParent);
      console.log('✅ Linked Zainab to Layla (mother)');
    }

    // Update teacher courses (based on mock data)
    console.log('📚 Updating teacher courses...');
    
    // Fatima teaches Islamic Studies and Quran
    const fatimaTeacher = await teacherRepository.findOne({ where: { id: createdUsers['fatima.alzahra@example.com'].id } });
    if (fatimaTeacher) {
      fatimaTeacher.courses = ['Islamic Studies', 'Quran Recitation', 'Hadith Studies'];
      await teacherRepository.save(fatimaTeacher);
      console.log('✅ Updated Fatima\'s courses');
    }

    // Yusuf teaches Arabic
    const yusufTeacher = await teacherRepository.findOne({ where: { id: createdUsers['yusuf.alkhalil@example.com'].id } });
    if (yusufTeacher) {
      yusufTeacher.courses = ['Arabic Language', 'Arabic Grammar', 'Arabic Calligraphy'];
      await teacherRepository.save(yusufTeacher);
      console.log('✅ Updated Yusuf\'s courses');
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${Object.keys(createdUsers).length}`);
    console.log(`   👨‍👩‍👧‍👦 Parents: ${Object.keys(createdParents).length}`);
    console.log(`   🎓 Students: ${Object.keys(createdStudents).length}`);
    console.log(`   👨‍🏫 Teachers: ${mockUsers.filter(u => u.role === 'teacher').length}`);
    console.log(`   🔗 Student-Parent Links: 3`);

    console.log('\n🔑 Default passwords for all users: password123');
    console.log('\n📧 Test accounts:');
    console.log('   Admin: ahmed.alrashid@example.com');
    console.log('   Teacher: fatima.alzahra@example.com');
    console.log('   Parent: omar.alhassan@example.com');
    console.log('   Student: aisha.almahmoud@example.com');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
