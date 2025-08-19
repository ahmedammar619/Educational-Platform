// Mock Data for Baraem Al-Nour Management System

// Users Mock Data
export const mockUsers = {
  teachers: [
    {
      id: 101,
      name: 'Sheikh Abdullah Al-Mahmoud',
      email: 'abdullah@baraemalNoor.com',
      phone: '+966-50-123-4567',
      role: 'teacher',
      specialization: 'Quran Memorization',
      joinDate: '2023-01-15',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 102,
      name: 'Ustadha Aisha Al-Zahra',
      email: 'aisha@baraemalNoor.com',
      phone: '+966-50-234-5678',
      role: 'teacher',
      specialization: 'Arabic Language',
      joinDate: '2023-02-20',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 103,
      name: 'Sheikh Omar Al-Faruq',
      email: 'omar@baraemalNour.com',
      phone: '+966-50-345-6789',
      role: 'teacher',
      specialization: 'Islamic Studies',
      joinDate: '2023-03-10',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 104,
      name: 'Ustadha Khadija Al-Kubra',
      email: 'khadija@baraemalNour.com',
      phone: '+966-50-456-7890',
      role: 'teacher',
      specialization: 'Tajweed',
      joinDate: '2023-04-05',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 105,
      name: 'Sheikh Hassan Al-Basri',
      email: 'hassan@baraemalNour.com',
      phone: '+966-50-567-8901',
      role: 'teacher',
      specialization: 'Hadith Studies',
      joinDate: '2023-05-12',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 106,
      name: 'Jane Teacher',
      email: 'jane.teacher@education.com',
      phone: '+1-555-0002',
      role: 'teacher',
      specialization: 'Islamic History',
      joinDate: '2023-06-01',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    }
  ],
  students: [
    {
      id: 201,
      name: 'Ahmad Al-Noor',
      email: 'ahmad@student.com',
      phone: '+966-50-111-2222',
      role: 'student',
      age: 12,
      parentId: 301,
      enrolledClasses: [1, 2, 6, 8, 11], // Quran Juz 1, Arabic Basics, Islamic History, Fiqh, Quran Tafseer
      joinDate: '2023-09-01',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      interestedCourses: ['Quran Memorization', 'Arabic Language']
    },
    {
      id: 202,
      name: 'Fatima Al-Zahra',
      email: 'fatima@student.com',
      phone: '+966-50-222-3333',
      role: 'student',
      age: 10,
      parentId: 301,
      enrolledClasses: [1, 3, 7, 8, 9, 12], // Quran Juz 1, Islamic Studies, Quran Juz 2, Fiqh, Seerah, Islamic Ethics
      joinDate: '2023-09-01',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      interestedCourses: ['Quran Memorization', 'Islamic Studies']
    },
    {
      id: 203,
      name: 'Yusuf Al-Salam',
      email: 'yusuf@student.com',
      phone: '+966-50-333-4444',
      role: 'student',
      age: 14,
      parentId: 302,
      enrolledClasses: [2, 3, 4, 6, 8, 10, 11], // Arabic Basics, Islamic Studies, Tajweed, Islamic History, Fiqh, Advanced Arabic, Quran Tafseer
      joinDate: '2023-09-15',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      interestedCourses: ['Arabic Language', 'Islamic Studies', 'Tajweed']
    },
    {
      id: 204,
      name: 'Maryam Al-Siddiq',
      email: 'maryam@student.com',
      phone: '+966-50-444-5555',
      role: 'student',
      age: 11,
      parentId: 303,
      enrolledClasses: [1, 4, 7, 8, 9, 12], // Quran Juz 1, Tajweed, Quran Juz 2, Fiqh, Seerah, Islamic Ethics
      joinDate: '2023-10-01',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      interestedCourses: ['Quran Memorization', 'Tajweed']
    },
    {
      id: 205,
      name: 'Omar Al-Khattab',
      email: 'omar@student.com',
      phone: '+966-50-555-6666',
      role: 'student',
      age: 13,
      parentId: 304,
      enrolledClasses: [3, 5, 8, 9, 11], // Islamic Studies, Hadith Studies, Fiqh, Seerah, Quran Tafseer
      joinDate: '2023-10-15',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      interestedCourses: ['Islamic Studies', 'Hadith Studies']
    }
  ],
  parents: [
    {
      id: 301,
      name: 'Abu Ahmad Al-Noor',
      email: 'parent1@baraemalNour.com',
      phone: '+966-50-555-6666',
      role: 'parent',
      children: [201, 202],
      joinDate: '2023-08-20',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 302,
      name: 'Abu Yusuf Al-Salam',
      email: 'parent2@baraemalNour.com',
      phone: '+966-50-666-7777',
      role: 'parent',
      children: [203],
      joinDate: '2023-08-25',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 303,
      name: 'Abu Maryam Al-Siddiq',
      email: 'parent3@baraemalNour.com',
      phone: '+966-50-777-8888',
      role: 'parent',
      children: [204],
      joinDate: '2023-09-10',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 304,
      name: 'Abu Omar Al-Khattab',
      email: 'parent4@baraemalNour.com',
      phone: '+966-50-888-9999',
      role: 'parent',
      children: [205],
      joinDate: '2023-09-20',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    }
  ],
  admins: [
    {
      id: 401,
      name: 'Admin User',
      email: 'admin@baraemalNour.com',
      phone: '+966-50-999-0000',
      role: 'admin',
      joinDate: '2023-01-01',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    }
  ]
};

// Classes Mock Data - All properly connected with real students, teachers, and parents
export const mockClasses = [
  {
    id: 1,
    name: 'Quran Memorization - Juz 1',
    teacher: 'Sheikh Abdullah Al-Mahmoud',
    teacherId: 101,
    numberOfSessions: 24,
    sessionDuration: 60, // minutes
    price: 500, // SAR
    students: [201, 202, 204], // Ahmad, Fatima, Maryam
    schedule: 'Sunday & Tuesday 4:00 PM',
    scheduleDays: ['Sunday', 'Tuesday'],
    startTime: '16:00', // 4:00 PM in 24-hour format
    endTime: '17:00',   // 5:00 PM in 24-hour format
    description: 'Memorization of the first Juz of the Holy Quran with proper Tajweed',
    startDate: '2023-09-01',
    endDate: '2023-12-01',
    status: 'active'
  },
  {
    id: 2,
    name: 'Arabic Language Basics',
    teacher: 'Ustadha Aisha Al-Zahra',
    teacherId: 102,
    numberOfSessions: 20,
    sessionDuration: 45,
    price: 400,
    students: [201, 203], // Ahmad, Yusuf
    schedule: 'Monday & Wednesday 5:00 PM',
    scheduleDays: ['Monday', 'Wednesday'],
    startTime: '17:00', // 5:00 PM in 24-hour format
    endTime: '17:45',   // 5:45 PM in 24-hour format
    description: 'Basic Arabic reading, writing, and grammar for beginners',
    startDate: '2023-09-05',
    endDate: '2023-11-30',
    status: 'active'
  },
  {
    id: 3,
    name: 'Islamic Studies Foundation',
    teacher: 'Sheikh Omar Al-Faruq',
    teacherId: 103,
    numberOfSessions: 16,
    sessionDuration: 50,
    price: 350,
    students: [202, 203, 205], // Fatima, Yusuf, Omar
    schedule: 'Thursday & Friday 6:00 PM',
    scheduleDays: ['Thursday', 'Friday'],
    startTime: '18:00', // 6:00 PM in 24-hour format
    endTime: '18:50',   // 6:50 PM in 24-hour format
    description: 'Introduction to Islamic history, principles, and values',
    startDate: '2023-09-10',
    endDate: '2023-11-25',
    status: 'active'
  },
  {
    id: 4,
    name: 'Tajweed Mastery',
    teacher: 'Ustadha Khadija Al-Kubra',
    teacherId: 104,
    numberOfSessions: 18,
    sessionDuration: 55,
    price: 450,
    students: [203, 204], // Yusuf, Maryam
    schedule: 'Saturday & Monday 3:00 PM',
    scheduleDays: ['Saturday', 'Monday'],
    startTime: '15:00', // 3:00 PM in 24-hour format
    endTime: '15:55',   // 3:55 PM in 24-hour format
    description: 'Master the art of Quranic recitation with proper pronunciation and rules',
    startDate: '2023-10-01',
    endDate: '2023-12-15',
    status: 'active'
  },
  {
    id: 5,
    name: 'Hadith Studies',
    teacher: 'Sheikh Hassan Al-Basri',
    teacherId: 105,
    numberOfSessions: 12,
    sessionDuration: 60,
    price: 300,
    students: [205], // Omar
    schedule: 'Wednesday & Friday 7:00 PM',
    scheduleDays: ['Wednesday', 'Friday'],
    startTime: '19:00', // 7:00 PM in 24-hour format
    endTime: '20:00',   // 8:00 PM in 24-hour format
    description: 'Study of authentic Hadith collections and their interpretations',
    startDate: '2023-10-15',
    endDate: '2023-12-20',
    status: 'active'
  },
  {
    id: 6,
    name: 'Islamic History',
    teacher: 'Jane Teacher',
    teacherId: 106,
    numberOfSessions: 10,
    sessionDuration: 45,
    price: 250,
    students: [201, 203], // Ahmad, Yusuf
    schedule: 'Tuesday & Thursday 6:00 PM',
    scheduleDays: ['Tuesday', 'Thursday'],
    startTime: '18:00', // 6:00 PM in 24-hour format
    endTime: '18:45',   // 6:45 PM in 24-hour format
    description: 'Introduction to Islamic history and its significance',
    startDate: '2023-11-01',
    endDate: '2023-12-31',
    status: 'upcoming'
  },
  {
    id: 7,
    name: 'Quran Memorization - Juz 2',
    teacher: 'Sheikh Abdullah Al-Mahmoud',
    teacherId: 101,
    numberOfSessions: 24,
    sessionDuration: 60,
    price: 500,
    students: [202, 204], // Fatima, Maryam (advanced students)
    schedule: 'Sunday & Tuesday 5:00 PM',
    scheduleDays: ['Sunday', 'Tuesday'],
    startTime: '17:00', // 5:00 PM in 24-hour format
    endTime: '18:00',   // 6:00 PM in 24-hour format
    description: 'Memorization of the second Juz of the Holy Quran',
    startDate: '2024-01-01',
    endDate: '2024-04-01',
    status: 'upcoming'
  },
  {
    id: 8,
    name: 'Fiqh (Islamic Jurisprudence)',
    teacher: 'Sheikh Omar Al-Faruq',
    teacherId: 103,
    numberOfSessions: 16,
    sessionDuration: 60,
    price: 400,
    students: [201, 202, 203, 204, 205], // All students
    schedule: 'Monday & Thursday 4:00 PM',
    scheduleDays: ['Monday', 'Thursday'],
    startTime: '16:00', // 4:00 PM in 24-hour format
    endTime: '17:00',   // 5:00 PM in 24-hour format
    description: 'Study of Islamic law and legal principles',
    startDate: '2024-01-15',
    endDate: '2024-04-15',
    status: 'active'
  },
  {
    id: 9,
    name: 'Seerah (Prophet\'s Biography)',
    teacher: 'Ustadha Khadija Al-Kubra',
    teacherId: 104,
    numberOfSessions: 14,
    sessionDuration: 50,
    price: 350,
    students: [202, 204, 205], // Fatima, Maryam, Omar
    schedule: 'Wednesday & Saturday 5:00 PM',
    scheduleDays: ['Wednesday', 'Saturday'],
    startTime: '17:00', // 5:00 PM in 24-hour format
    endTime: '17:50',   // 5:50 PM in 24-hour format
    description: 'Life and teachings of Prophet Muhammad (PBUH)',
    startDate: '2024-02-01',
    endDate: '2024-05-01',
    status: 'active'
  },
  {
    id: 10,
    name: 'Advanced Arabic Grammar',
    teacher: 'Ustadha Aisha Al-Zahra',
    teacherId: 102,
    numberOfSessions: 18,
    sessionDuration: 60,
    price: 450,
    students: [203], // Yusuf (advanced level)
    schedule: 'Tuesday & Friday 4:00 PM',
    scheduleDays: ['Tuesday', 'Friday'],
    startTime: '16:00', // 4:00 PM in 24-hour format
    endTime: '17:00',   // 5:00 PM in 24-hour format
    description: 'Advanced Arabic grammar and composition',
    startDate: '2024-01-20',
    endDate: '2024-04-20',
    status: 'active'
  },
  {
    id: 11,
    name: 'Quran Tafseer (Interpretation)',
    teacher: 'Sheikh Hassan Al-Basri',
    teacherId: 105,
    numberOfSessions: 20,
    sessionDuration: 60,
    price: 500,
    students: [201, 203, 205], // Ahmad, Yusuf, Omar
    schedule: 'Saturday & Sunday 6:00 PM',
    scheduleDays: ['Saturday', 'Sunday'],
    startTime: '18:00', // 6:00 PM in 24-hour format
    endTime: '19:00',   // 7:00 PM in 24-hour format
    description: 'Deep study of Quranic meanings and interpretations',
    startDate: '2024-02-15',
    endDate: '2024-05-15',
    status: 'active'
  },
  {
    id: 12,
    name: 'Islamic Ethics & Morality',
    teacher: 'Jane Teacher',
    teacherId: 106,
    numberOfSessions: 12,
    sessionDuration: 45,
    price: 300,
    students: [202, 204], // Fatima, Maryam
    schedule: 'Monday & Wednesday 6:00 PM',
    scheduleDays: ['Monday', 'Wednesday'],
    startTime: '18:00', // 6:00 PM in 24-hour format
    endTime: '18:45',   // 6:45 PM in 24-hour format
    description: 'Islamic values, ethics, and character building',
    startDate: '2024-03-01',
    endDate: '2024-05-31',
    status: 'upcoming'
  }
];

// Messages Mock Data
export const mockMessages = [
  {
    id: 1,
    from: 'Abu Ahmad Al-Noor',
    fromId: 301,
    fromRole: 'parent',
    to: 'Sheikh Abdullah Al-Mahmoud',
    toId: 101,
    toRole: 'teacher',
    subject: 'Ahmad\'s Progress in Quran Memorization',
    message: 'Assalamu Alaikum Sheikh Abdullah. I wanted to ask about Ahmad\'s progress in memorizing Surah Al-Baqarah. How is he doing with his recitation?',
    timestamp: '2023-10-15T10:30:00Z',
    read: false,
    replied: false
  },
  {
    id: 2,
    from: 'Sheikh Abdullah Al-Mahmoud',
    fromId: 101,
    fromRole: 'teacher',
    to: 'Abu Ahmad Al-Noor',
    toId: 301,
    toRole: 'parent',
    subject: 'Re: Ahmad\'s Progress in Quran Memorization',
    message: 'Wa alaikum assalam. Ahmad is doing very well mashallah. He has memorized the first 50 verses with good tajweed. I recommend more practice at home.',
    timestamp: '2023-10-15T14:20:00Z',
    read: true,
    replied: true,
    replyTo: 1
  },
  {
    id: 3,
    from: 'Abu Yusuf Al-Salam',
    fromId: 302,
    fromRole: 'parent',
    to: 'Ustadha Aisha Al-Zahra',
    toId: 102,
    toRole: 'teacher',
    subject: 'Yusuf\'s Arabic Homework',
    message: 'Assalamu Alaikum Ustadha. Yusuf is having difficulty with Arabic grammar exercises. Could you provide additional practice materials?',
    timestamp: '2023-10-14T16:45:00Z',
    read: false,
    replied: false
  }
];

// Calendar Events Mock Data - All properly connected with real classes, teachers, and students
export const mockCalendarEvents = [
  // Current week events - All based on actual mockClasses data
  {
    id: 1,
    title: 'Quran Memorization - Juz 1',
    classId: 1,
    teacherId: 101,
    students: [201, 202, 204], // Ahmad, Fatima, Maryam
    start: '2025-02-16T16:00:00',
    end: '2025-02-16T17:00:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room A1'
  },
  {
    id: 2,
    title: 'Arabic Language Basics',
    classId: 2,
    teacherId: 102,
    students: [201, 203], // Ahmad, Yusuf
    start: '2025-02-17T17:00:00',
    end: '2025-02-17T17:45:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room B2'
  },
  {
    id: 3,
    title: 'Islamic Studies Foundation',
    classId: 3,
    teacherId: 103,
    students: [202, 203, 205], // Fatima, Yusuf, Omar
    start: '2025-02-20T18:00:00',
    end: '2025-02-20T18:50:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room C1'
  },
  {
    id: 4,
    title: 'Tajweed Mastery',
    classId: 4,
    teacherId: 104,
    students: [203, 204], // Yusuf, Maryam
    start: '2025-02-15T15:00:00',
    end: '2025-02-15T15:55:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room A2'
  },
  {
    id: 5,
    title: 'Hadith Studies',
    classId: 5,
    teacherId: 105,
    students: [205], // Omar
    start: '2025-02-19T19:00:00',
    end: '2025-02-19T20:00:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room B1'
  },
  // Next week events - All based on actual mockClasses data
  {
    id: 6,
    title: 'Quran Memorization - Juz 1',
    classId: 1,
    teacherId: 101,
    students: [201, 202, 204], // Ahmad, Fatima, Maryam
    start: '2025-02-23T16:00:00',
    end: '2025-02-23T17:00:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room A1'
  },
  {
    id: 7,
    title: 'Arabic Language Basics',
    classId: 2,
    teacherId: 102,
    students: [201, 203], // Ahmad, Yusuf
    start: '2025-02-24T17:00:00',
    end: '2025-02-24T17:45:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room B2'
  },
  {
    id: 8,
    title: 'Tajweed Mastery',
    classId: 4,
    teacherId: 104,
    students: [203, 204], // Yusuf, Maryam
    start: '2025-02-24T15:00:00',
    end: '2025-02-24T15:55:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room A2'
  },
  {
    id: 9,
    title: 'Islamic History',
    classId: 6,
    teacherId: 106,
    students: [201, 203], // Ahmad, Yusuf
    start: '2025-02-18T18:00:00',
    end: '2025-02-18T18:45:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room D1'
  },
  {
    id: 10,
    title: 'Islamic History',
    classId: 6,
    teacherId: 106,
    students: [201, 203], // Ahmad, Yusuf
    start: '2025-02-20T18:00:00',
    end: '2025-02-20T18:45:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room D1'
  },
  {
    id: 11,
    title: 'Islamic History',
    classId: 6,
    teacherId: 106,
    students: [201, 203], // Ahmad, Yusuf
    start: '2025-02-25T18:00:00',
    end: '2025-02-25T18:45:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room D1'
  },
  {
    id: 12,
    title: 'Islamic History',
    classId: 6,
    teacherId: 106,
    students: [201, 203], // Ahmad, Yusuf
    start: '2025-02-27T18:00:00',
    end: '2025-02-27T18:45:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room D1'
  },
  // Additional weekly recurring events - All based on actual mockClasses data
  {
    id: 13,
    title: 'Fiqh (Islamic Jurisprudence)',
    classId: 8,
    teacherId: 103,
    students: [201, 202, 203, 204, 205], // All students: Ahmad, Fatima, Yusuf, Maryam, Omar
    start: '2025-02-24T16:00:00',
    end: '2025-02-24T17:00:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room C2'
  },
  {
    id: 14,
    title: 'Seerah (Prophet\'s Biography)',
    classId: 9,
    teacherId: 104,
    students: [202, 204, 205], // Fatima, Maryam, Omar
    start: '2025-02-22T17:00:00',
    end: '2025-02-22T17:50:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room A3'
  },
  {
    id: 15,
    title: 'Advanced Arabic Grammar',
    classId: 10,
    teacherId: 102,
    students: [203], // Yusuf (advanced level)
    start: '2025-02-25T16:00:00',
    end: '2025-02-25T17:00:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room B3'
  },
  {
    id: 16,
    title: 'Quran Tafseer (Interpretation)',
    classId: 11,
    teacherId: 105,
    students: [201, 203, 205], // Ahmad, Yusuf, Omar
    start: '2025-02-23T18:00:00',
    end: '2025-02-23T19:00:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room D2'
  }
];

// Analytics Mock Data
export const mockAnalytics = {
  admin: {
    totalUsers: 16,
    totalTeachers: 6,
    totalStudents: 5,
    totalParents: 4,
    totalClasses: 12,
    activeClasses: 10,
    revenue: 13250,
    monthlyGrowth: 15.2,
    userGrowthData: [
      { month: 'Sep', users: 8 },
      { month: 'Oct', users: 12 },
      { month: 'Nov', users: 14 },
      { month: 'Dec', users: 15 },
      { month: 'Jan', users: 15 },
      { month: 'Feb', users: 16 }
    ],
    revenueData: [
      { month: 'Sep', revenue: 2000 },
      { month: 'Oct', revenue: 4500 },
      { month: 'Nov', revenue: 6200 },
      { month: 'Dec', revenue: 7800 },
      { month: 'Jan', revenue: 8200 },
      { month: 'Feb', revenue: 13250 }
    ],
    classDistribution: [
      { name: 'Quran Memorization - Juz 1', students: 3, color: '#10B981' }, // Ahmad, Fatima, Maryam
      { name: 'Arabic Language Basics', students: 2, color: '#3B82F6' }, // Ahmad, Yusuf
      { name: 'Islamic Studies Foundation', students: 3, color: '#8B5CF6' }, // Fatima, Yusuf, Omar
      { name: 'Tajweed Mastery', students: 2, color: '#F59E0B' }, // Yusuf, Maryam
      { name: 'Hadith Studies', students: 1, color: '#EF4444' }, // Omar
      { name: 'Islamic History', students: 2, color: '#06B6D4' }, // Ahmad, Yusuf
      { name: 'Quran Memorization - Juz 2', students: 2, color: '#10B981' }, // Fatima, Maryam
      { name: 'Fiqh (Islamic Jurisprudence)', students: 5, color: '#8B5A2B' }, // All students
      { name: 'Seerah (Prophet\'s Biography)', students: 3, color: '#FF69B4' }, // Fatima, Maryam, Omar
      { name: 'Advanced Arabic Grammar', students: 1, color: '#32CD32' }, // Yusuf
      { name: 'Quran Tafseer (Interpretation)', students: 3, color: '#FF4500' }, // Ahmad, Yusuf, Omar
      { name: 'Islamic Ethics & Morality', students: 2, color: '#9370DB' } // Fatima, Maryam
    ]
  },
  student: {
    enrolledClasses: 2,
    completedSessions: 18,
    upcomingSessions: 6,
    overallProgress: 85,
    attendance: 94,
    classProgress: [
      { class: 'Quran Memorization - Juz 1', progress: 85, grade: 'A', teacher: 'Sheikh Abdullah Al-Mahmoud' },
      { class: 'Arabic Language Basics', progress: 88, grade: 'A-', teacher: 'Ustadha Aisha Al-Zahra' }
    ],
    monthlyProgress: [
      { month: 'Oct', progress: 70 },
      { month: 'Nov', progress: 78 },
      { month: 'Dec', progress: 82 },
      { month: 'Jan', progress: 85 },
      { month: 'Feb', progress: 85 }
    ],
    upcomingEvents: [
      {
        title: 'Quran Memorization - Juz 1',
        date: '2025-02-16',
        time: '4:00 PM',
        type: 'class'
      },
      {
        title: 'Arabic Language Basics',
        date: '2025-02-17',
        time: '5:00 PM',
        type: 'class'
      }
    ]
  }
};

// Helper functions
export const getUserById = (id, role) => {
  const users = mockUsers[role + 's'] || [];
  return users.find(user => user.id === id);
};

export const getClassById = (id) => {
  return mockClasses.find(cls => cls.id === id);
};

export const getClassesByTeacher = (teacherId) => {
  console.log('getClassesByTeacher called with teacherId:', teacherId);
  console.log('Available classes:', mockClasses);
  const filteredClasses = mockClasses.filter(cls => cls.teacherId === teacherId);
  console.log('Filtered classes for teacher', teacherId, ':', filteredClasses);
  return filteredClasses;
};

export const getClassesByStudent = (studentId) => {
  return mockClasses.filter(cls => cls.students.includes(studentId));
};

export const getMessagesByUser = (userId, userRole) => {
  return mockMessages.filter(msg => 
    (msg.fromId === userId && msg.fromRole === userRole) ||
    (msg.toId === userId && msg.toRole === userRole)
  );
};

// Available courses for registration
export const availableCourses = [
  'Quran Memorization',
  'Arabic Language',
  'Islamic Studies',
  'Tajweed',
  'Hadith Studies',
  'Islamic History',
  'Fiqh (Islamic Jurisprudence)',
  'Seerah (Prophet\'s Biography)',
  'Advanced Arabic Grammar',
  'Quran Tafseer (Interpretation)',
  'Islamic Ethics & Morality'
];

export const getCalendarEventsByUser = (userId, userRole) => {
  switch (userRole) {
    case 'teacher':
      return mockCalendarEvents.filter(event => event.teacherId === userId);
    case 'parent':
      const parent = getUserById(userId, 'parent');
      return mockCalendarEvents.filter(event => 
        event.students && event.students.some(studentId => parent.children.includes(studentId))
      );
    case 'student':
      return mockCalendarEvents.filter(event => 
        event.students && event.students.includes(userId)
      );
    default:
      return mockCalendarEvents;
  }
};

// Helper function to convert day names to day numbers (0-6, where 0 is Sunday)
export const getDayNumber = (dayName) => {
  const dayMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  return dayMap[dayName] || 0;
};

// Helper function to get day name from day number
export const getDayName = (dayNumber) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[dayNumber] || 'Sunday';
};

// Helper function to format schedule for display
export const formatScheduleDisplay = (scheduleDays, startTime, endTime) => {
  if (!scheduleDays || scheduleDays.length === 0) return 'Schedule TBD';
  
  // Convert 24-hour format to 12-hour format for display
  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };
  
  const timeDisplay = startTime && endTime ? `${formatTime(startTime)} - ${formatTime(endTime)}` : 'Time TBD';
  
  if (scheduleDays.length === 1) {
    return `${scheduleDays[0]} ${timeDisplay}`;
  } else if (scheduleDays.length === 2) {
    return `${scheduleDays[0]} & ${scheduleDays[1]} ${timeDisplay}`;
  } else {
    const lastDay = scheduleDays.pop();
    return `${scheduleDays.join(', ')} & ${lastDay} ${timeDisplay}`;
  }
};

// Helper function to check if a course is scheduled on a specific day
export const isCourseScheduledOnDay = (course, dayName) => {
  return course.scheduleDays && course.scheduleDays.includes(dayName);
};

// Helper function to get all courses scheduled on a specific day
export const getCoursesByDay = (dayName) => {
  return mockClasses.filter(course => isCourseScheduledOnDay(course, dayName));
};

// Helper function to convert 24-hour time to 12-hour format
export const convert24To12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
};

// Helper function to get time range display
export const getTimeRangeDisplay = (startTime, endTime) => {
  if (!startTime || !endTime) return 'Time TBD';
  return `${convert24To12Hour(startTime)} - ${convert24To12Hour(endTime)}`;
};

// Teacher Schedule Mock Data - All properly connected with real classes and students
export const mockTeacherSchedule = {
  schedule: [
    {
      id: 1,
      title: 'Quran Memorization - Juz 1',
      type: 'lecture',
      start_time: '2025-08-18T16:00:00Z',
      end_time: '2025-08-18T17:00:00Z',
      location: 'Room A1',
      instructor_name: 'Sheikh Abdullah Al-Mahmoud',
      course_title: 'Quran Memorization',
      description: 'Memorization of the first Juz of the Holy Quran with proper Tajweed',
      students: [201, 202, 204] // Ahmad, Fatima, Maryam
    },
    {
      id: 2,
      title: 'Arabic Language Basics',
      type: 'lecture',
      start_time: '2025-08-19T17:00:00Z',
      end_time: '2025-08-19T17:45:00Z',
      location: 'Room B2',
      instructor_name: 'Ustadha Aisha Al-Zahra',
      course_title: 'Arabic Language',
      description: 'Basic Arabic reading, writing, and grammar for beginners',
      students: [201, 203] // Ahmad, Yusuf
    },
    {
      id: 3,
      title: 'Islamic Studies Foundation',
      type: 'lecture',
      start_time: '2025-08-20T18:00:00Z',
      end_time: '2025-08-20T18:50:00Z',
      location: 'Room C1',
      instructor_name: 'Sheikh Omar Al-Faruq',
      course_title: 'Islamic Studies',
      description: 'Introduction to Islamic history, principles, and values',
      students: [202, 203, 205] // Fatima, Yusuf, Omar
    },
    {
      id: 4,
      title: 'Tajweed Mastery',
      type: 'lecture',
      start_time: '2025-08-21T15:00:00Z',
      end_time: '2025-08-21T15:55:00Z',
      location: 'Room A2',
      instructor_name: 'Ustadha Khadija Al-Kubra',
      course_title: 'Tajweed',
      description: 'Master the art of Quranic recitation with proper pronunciation and rules',
      students: [203, 204] // Yusuf, Maryam
    },
    {
      id: 5,
      title: 'Hadith Studies',
      type: 'lecture',
      start_time: '2025-08-22T19:00:00Z',
      end_time: '2025-08-22T20:00:00Z',
      location: 'Room B1',
      instructor_name: 'Sheikh Hassan Al-Basri',
      course_title: 'Hadith Studies',
      description: 'Study of authentic Hadith collections and their interpretations',
      students: [205] // Omar
    },
    {
      id: 6,
      title: 'Fiqh (Islamic Jurisprudence)',
      type: 'lecture',
      start_time: '2025-08-23T16:00:00Z',
      end_time: '2025-08-23T17:00:00Z',
      location: 'Room C2',
      instructor_name: 'Sheikh Omar Al-Faruq',
      course_title: 'Fiqh',
      description: 'Study of Islamic law and legal principles',
      students: [201, 202, 203, 204, 205] // All students
    }
  ]
};

// Teacher Courses Mock Data - All properly connected with real students and consistent with mockClasses
export const mockTeacherCourses = {
  courses: [
    {
      id: 1,
      title: 'Quran Memorization - Juz 1',
      code: 'QM-101',
      description: 'Memorization of the first Juz of the Holy Quran with proper Tajweed',
      students: 3, // Ahmad, Fatima, Maryam
      schedule: 'Sunday & Tuesday 4:00 PM',
      scheduleDays: ['Sunday', 'Tuesday'],
      startTime: '16:00', // 4:00 PM in 24-hour format
      endTime: '17:00',   // 5:00 PM in 24-hour format
      status: 'active'
    },
    {
      id: 2,
      title: 'Arabic Language Basics',
      code: 'AL-101',
      description: 'Basic Arabic reading, writing, and grammar for beginners',
      students: 2, // Ahmad, Yusuf
      schedule: 'Monday & Wednesday 5:00 PM',
      scheduleDays: ['Monday', 'Wednesday'],
      startTime: '17:00', // 5:00 PM in 24-hour format
      endTime: '17:45',   // 5:45 PM in 24-hour format
      status: 'active'
    },
    {
      id: 3,
      title: 'Islamic Studies Foundation',
      code: 'IS-101',
      description: 'Introduction to Islamic history, principles, and values',
      students: 3, // Fatima, Yusuf, Omar
      schedule: 'Thursday & Friday 6:00 PM',
      scheduleDays: ['Thursday', 'Friday'],
      startTime: '18:00', // 6:00 PM in 24-hour format
      endTime: '18:50',   // 6:50 PM in 24-hour format
      status: 'active'
    },
    {
      id: 4,
      title: 'Tajweed Mastery',
      code: 'TJ-101',
      description: 'Master the art of Quranic recitation with proper pronunciation and rules',
      students: 2, // Yusuf, Maryam
      schedule: 'Saturday & Monday 3:00 PM',
      scheduleDays: ['Saturday', 'Monday'],
      startTime: '15:00', // 3:00 PM in 24-hour format
      endTime: '15:55',   // 3:55 PM in 24-hour format
      status: 'active'
    },
    {
      id: 5,
      title: 'Hadith Studies',
      code: 'HS-101',
      description: 'Study of authentic Hadith collections and their interpretations',
      students: 1, // Omar
      schedule: 'Wednesday & Friday 7:00 PM',
      scheduleDays: ['Wednesday', 'Friday'],
      startTime: '19:00', // 7:00 PM in 24-hour format
      endTime: '20:00',   // 8:00 PM in 24-hour format
      status: 'active'
    },
    {
      id: 6,
      title: 'Islamic History',
      code: 'IH-101',
      description: 'Introduction to Islamic history and its significance',
      students: 2, // Ahmad, Yusuf
      schedule: 'Tuesday & Thursday 6:00 PM',
      scheduleDays: ['Tuesday', 'Thursday'],
      startTime: '18:00', // 6:00 PM in 24-hour format
      endTime: '18:45',   // 6:45 PM in 24-hour format
      status: 'upcoming'
    },
    {
      id: 7,
      title: 'Quran Memorization - Juz 2',
      code: 'QM-102',
      description: 'Memorization of the second Juz of the Holy Quran',
      students: 2, // Fatima, Maryam (advanced students)
      schedule: 'Sunday & Tuesday 5:00 PM',
      scheduleDays: ['Sunday', 'Tuesday'],
      startTime: '17:00', // 5:00 PM in 24-hour format
      endTime: '18:00',   // 6:00 PM in 24-hour format
      status: 'upcoming'
    },
    {
      id: 8,
      title: 'Fiqh (Islamic Jurisprudence)',
      code: 'FI-101',
      description: 'Study of Islamic law and legal principles',
      students: 5, // All students: Ahmad, Fatima, Yusuf, Maryam, Omar
      schedule: 'Monday & Thursday 4:00 PM',
      scheduleDays: ['Monday', 'Thursday'],
      startTime: '16:00', // 4:00 PM in 24-hour format
      endTime: '17:00',   // 5:00 PM in 24-hour format
      status: 'active'
    },
    {
      id: 9,
      title: 'Seerah (Prophet\'s Biography)',
      code: 'SE-101',
      description: 'Life and teachings of Prophet Muhammad (PBUH)',
      students: 3, // Fatima, Maryam, Omar
      schedule: 'Wednesday & Saturday 5:00 PM',
      scheduleDays: ['Wednesday', 'Saturday'],
      startTime: '17:00', // 5:00 PM in 24-hour format
      endTime: '17:50',   // 5:50 PM in 24-hour format
      status: 'active'
    },
    {
      id: 10,
      title: 'Advanced Arabic Grammar',
      code: 'AA-101',
      description: 'Advanced Arabic grammar and composition',
      students: 1, // Yusuf (advanced level)
      schedule: 'Tuesday & Friday 4:00 PM',
      scheduleDays: ['Tuesday', 'Friday'],
      startTime: '16:00', // 4:00 PM in 24-hour format
      endTime: '17:00',   // 5:00 PM in 24-hour format
      status: 'active'
    },
    {
      id: 11,
      title: 'Quran Tafseer (Interpretation)',
      code: 'QT-101',
      description: 'Deep study of Quranic meanings and interpretations',
      students: 3, // Ahmad, Yusuf, Omar
      schedule: 'Saturday & Sunday 6:00 PM',
      scheduleDays: ['Saturday', 'Sunday'],
      startTime: '18:00', // 6:00 PM in 24-hour format
      endTime: '19:00',   // 7:00 PM in 24-hour format
      status: 'active'
    },
    {
      id: 12,
      title: 'Islamic Ethics & Morality',
      code: 'IE-101',
      description: 'Islamic values, ethics, and character building',
      students: 2, // Fatima, Maryam
      schedule: 'Monday & Wednesday 6:00 PM',
      scheduleDays: ['Monday', 'Wednesday'],
      startTime: '18:00', // 6:00 PM in 24-hour format
      endTime: '18:45',   // 6:45 PM in 24-hour format
      status: 'upcoming'
    }
  ]
};

// Student Schedule Mock Data - Empty since we generate all events dynamically from enrolled classes
export const mockStudentSchedule = {
  schedule: []
};

// Student Courses Mock Data - All properly connected with real instructors and consistent with mockClasses
export const mockStudentCourses = {
  courses: [
    {
      id: 1,
      title: 'Quran Memorization - Juz 1',
      code: 'QM-101',
      description: 'Memorization of the first Juz of the Holy Quran with proper Tajweed',
      instructor: 'Sheikh Abdullah Al-Mahmoud',
      schedule: 'Sunday & Tuesday 4:00 PM',
      scheduleDays: ['Sunday', 'Tuesday'],
      startTime: '16:00', // 4:00 PM in 24-hour format
      endTime: '17:00',   // 5:00 PM in 24-hour format
      progress: 85,
      status: 'active'
    },
    {
      id: 2,
      title: 'Arabic Language Basics',
      code: 'AL-101',
      description: 'Basic Arabic reading, writing, and grammar for beginners',
      instructor: 'Ustadha Aisha Al-Zahra',
      schedule: 'Monday & Wednesday 5:00 PM',
      scheduleDays: ['Monday', 'Wednesday'],
      startTime: '17:00', // 5:00 PM in 24-hour format
      endTime: '17:45',   // 5:45 PM in 24-hour format
      progress: 88,
      status: 'active'
    },
    {
      id: 3,
      title: 'Islamic Studies Foundation',
      code: 'IS-101',
      description: 'Introduction to Islamic history, principles, and values',
      instructor: 'Sheikh Omar Al-Faruq',
      schedule: 'Thursday & Friday 6:00 PM',
      scheduleDays: ['Thursday', 'Friday'],
      startTime: '18:00', // 6:00 PM in 24-hour format
      endTime: '18:50',   // 6:50 PM in 24-hour format
      progress: 92,
      status: 'active'
    },
    {
      id: 4,
      title: 'Tajweed Mastery',
      code: 'TJ-101',
      description: 'Master the art of Quranic recitation with proper pronunciation and rules',
      instructor: 'Ustadha Khadija Al-Kubra',
      schedule: 'Saturday & Monday 3:00 PM',
      scheduleDays: ['Saturday', 'Monday'],
      startTime: '15:00', // 3:00 PM in 24-hour format
      endTime: '15:55',   // 3:55 PM in 24-hour format
      progress: 78,
      status: 'active'
    },
    {
      id: 6,
      title: 'Islamic History',
      code: 'IH-101',
      description: 'Introduction to Islamic history and its significance',
      instructor: 'Jane Teacher',
      schedule: 'Tuesday & Thursday 6:00 PM',
      scheduleDays: ['Tuesday', 'Thursday'],
      startTime: '18:00', // 6:00 PM in 24-hour format
      endTime: '18:45',   // 6:45 PM in 24-hour format
      progress: 65,
      status: 'upcoming'
    },
    {
      id: 8,
      title: 'Fiqh (Islamic Jurisprudence)',
      code: 'FI-101',
      description: 'Study of Islamic law and legal principles',
      instructor: 'Sheikh Omar Al-Faruq',
      schedule: 'Monday & Thursday 4:00 PM',
      scheduleDays: ['Monday', 'Thursday'],
      startTime: '16:00', // 4:00 PM in 24-hour format
      endTime: '17:00',   // 5:00 PM in 24-hour format
      progress: 75,
      status: 'active'
    },
    {
      id: 10,
      title: 'Advanced Arabic Grammar',
      code: 'AA-101',
      description: 'Advanced Arabic grammar and composition',
      instructor: 'Ustadha Aisha Al-Zahra',
      schedule: 'Tuesday & Friday 4:00 PM',
      scheduleDays: ['Tuesday', 'Friday'],
      startTime: '16:00', // 4:00 PM in 24-hour format
      endTime: '17:00',   // 5:00 PM in 24-hour format
      progress: 82,
      status: 'active'
    },
    {
      id: 11,
      title: 'Quran Tafseer (Interpretation)',
      code: 'QT-101',
      description: 'Deep study of Quranic meanings and interpretations',
      instructor: 'Sheikh Hassan Al-Basri',
      schedule: 'Saturday & Sunday 6:00 PM',
      scheduleDays: ['Saturday', 'Sunday'],
      startTime: '18:00', // 6:00 PM in 24-hour format
      endTime: '19:00',   // 7:00 PM in 24-hour format
      progress: 60,
      status: 'active'
    }
  ]
};