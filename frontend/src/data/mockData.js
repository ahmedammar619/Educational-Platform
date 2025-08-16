// Mock Data for Baraem Al-Nour Management System

// Users Mock Data
export const mockUsers = {
  teachers: [
    {
      id: 1,
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
      id: 2,
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
      id: 3,
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
      id: 4,
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
      id: 5,
      name: 'Sheikh Hassan Al-Basri',
      email: 'hassan@baraemalNour.com',
      phone: '+966-50-567-8901',
      role: 'teacher',
      specialization: 'Hadith Studies',
      joinDate: '2023-05-12',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    }
  ],
  students: [
    {
      id: 1,
      name: 'Ahmad Al-Noor',
      email: 'ahmad@student.com',
      phone: '+966-50-111-2222',
      role: 'student',
      age: 12,
      parentId: 1,
      enrolledClasses: [1, 2],
      joinDate: '2023-09-01',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      interestedCourses: ['Quran Memorization', 'Arabic Language']
    },
    {
      id: 2,
      name: 'Fatima Al-Zahra',
      email: 'fatima@student.com',
      phone: '+966-50-222-3333',
      role: 'student',
      age: 10,
      parentId: 1,
      enrolledClasses: [1, 3],
      joinDate: '2023-09-01',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      interestedCourses: ['Quran Memorization', 'Islamic Studies']
    },
    {
      id: 3,
      name: 'Yusuf Al-Salam',
      email: 'yusuf@student.com',
      phone: '+966-50-333-4444',
      role: 'student',
      age: 14,
      parentId: 2,
      enrolledClasses: [2, 3, 4],
      joinDate: '2023-09-15',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      interestedCourses: ['Arabic Language', 'Islamic Studies', 'Tajweed']
    },
    {
      id: 4,
      name: 'Maryam Al-Siddiq',
      email: 'maryam@student.com',
      phone: '+966-50-444-5555',
      role: 'student',
      age: 11,
      parentId: 3,
      enrolledClasses: [1, 4],
      joinDate: '2023-10-01',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      interestedCourses: ['Quran Memorization', 'Tajweed']
    },
    {
      id: 5,
      name: 'Omar Al-Khattab',
      email: 'omar@student.com',
      phone: '+966-50-555-6666',
      role: 'student',
      age: 13,
      parentId: 4,
      enrolledClasses: [3, 5],
      joinDate: '2023-10-15',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      interestedCourses: ['Islamic Studies', 'Hadith Studies']
    }
  ],
  parents: [
    {
      id: 1,
      name: 'Abu Ahmad Al-Noor',
      email: 'parent1@baraemalNour.com',
      phone: '+966-50-555-6666',
      role: 'parent',
      children: [1, 2],
      joinDate: '2023-08-20',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 2,
      name: 'Abu Yusuf Al-Salam',
      email: 'parent2@baraemalNour.com',
      phone: '+966-50-666-7777',
      role: 'parent',
      children: [3],
      joinDate: '2023-08-25',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 3,
      name: 'Abu Maryam Al-Siddiq',
      email: 'parent3@baraemalNour.com',
      phone: '+966-50-777-8888',
      role: 'parent',
      children: [4],
      joinDate: '2023-09-10',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 4,
      name: 'Abu Omar Al-Khattab',
      email: 'parent4@baraemalNour.com',
      phone: '+966-50-888-9999',
      role: 'parent',
      children: [5],
      joinDate: '2023-09-20',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    }
  ],
  admins: [
    {
      id: 1,
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

// Classes Mock Data
export const mockClasses = [
  {
    id: 1,
    name: 'Quran Memorization - Juz 1',
    teacher: 'Sheikh Abdullah Al-Mahmoud',
    teacherId: 1,
    numberOfSessions: 24,
    sessionDuration: 60, // minutes
    price: 500, // SAR
    students: [1, 2, 4],
    schedule: 'Sunday & Tuesday 4:00 PM',
    description: 'Memorization of the first Juz of the Holy Quran with proper Tajweed',
    startDate: '2023-09-01',
    endDate: '2023-12-01',
    status: 'active'
  },
  {
    id: 2,
    name: 'Arabic Language Basics',
    teacher: 'Ustadha Aisha Al-Zahra',
    teacherId: 2,
    numberOfSessions: 20,
    sessionDuration: 45,
    price: 400,
    students: [1, 3],
    schedule: 'Monday & Wednesday 5:00 PM',
    description: 'Basic Arabic reading, writing, and grammar for beginners',
    startDate: '2023-09-05',
    endDate: '2023-11-30',
    status: 'active'
  },
  {
    id: 3,
    name: 'Islamic Studies Foundation',
    teacher: 'Sheikh Omar Al-Faruq',
    teacherId: 3,
    numberOfSessions: 16,
    sessionDuration: 50,
    price: 350,
    students: [2, 3, 5],
    schedule: 'Thursday & Friday 6:00 PM',
    description: 'Introduction to Islamic history, principles, and values',
    startDate: '2023-09-10',
    endDate: '2023-11-25',
    status: 'active'
  },
  {
    id: 4,
    name: 'Tajweed Mastery',
    teacher: 'Ustadha Khadija Al-Kubra',
    teacherId: 4,
    numberOfSessions: 18,
    sessionDuration: 55,
    price: 450,
    students: [3, 4],
    schedule: 'Saturday & Monday 3:00 PM',
    description: 'Master the art of Quranic recitation with proper pronunciation and rules',
    startDate: '2023-10-01',
    endDate: '2023-12-15',
    status: 'active'
  },
  {
    id: 5,
    name: 'Hadith Studies',
    teacher: 'Sheikh Hassan Al-Basri',
    teacherId: 5,
    numberOfSessions: 12,
    sessionDuration: 60,
    price: 300,
    students: [5],
    schedule: 'Wednesday & Friday 7:00 PM',
    description: 'Study of authentic Hadith collections and their interpretations',
    startDate: '2023-10-15',
    endDate: '2023-12-20',
    status: 'active'
  },
  {
    id: 6,
    name: 'Quran Memorization - Juz 2',
    teacher: 'Sheikh Abdullah Al-Mahmoud',
    teacherId: 1,
    numberOfSessions: 24,
    sessionDuration: 60,
    price: 500,
    students: [],
    schedule: 'Sunday & Tuesday 5:00 PM',
    description: 'Memorization of the second Juz of the Holy Quran',
    startDate: '2024-01-01',
    endDate: '2024-04-01',
    status: 'upcoming'
  }
];

// Messages Mock Data
export const mockMessages = [
  {
    id: 1,
    from: 'Abu Ahmad Al-Noor',
    fromId: 1,
    fromRole: 'parent',
    to: 'Sheikh Abdullah Al-Mahmoud',
    toId: 1,
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
    fromId: 1,
    fromRole: 'teacher',
    to: 'Abu Ahmad Al-Noor',
    toId: 1,
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
    fromId: 2,
    fromRole: 'parent',
    to: 'Ustadha Aisha Al-Zahra',
    toId: 2,
    toRole: 'teacher',
    subject: 'Yusuf\'s Arabic Homework',
    message: 'Assalamu Alaikum Ustadha. Yusuf is having difficulty with Arabic grammar exercises. Could you provide additional practice materials?',
    timestamp: '2023-10-14T16:45:00Z',
    read: false,
    replied: false
  }
];

// Calendar Events Mock Data
export const mockCalendarEvents = [
  // Current week events
  {
    id: 1,
    title: 'Quran Memorization - Juz 1',
    classId: 1,
    teacherId: 1,
    students: [1, 2, 4],
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
    teacherId: 2,
    students: [1, 3],
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
    teacherId: 3,
    students: [2, 3, 5],
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
    teacherId: 4,
    students: [3, 4],
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
    teacherId: 5,
    students: [5],
    start: '2025-02-19T19:00:00',
    end: '2025-02-19T20:00:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room B1'
  },
  // Next week events
  {
    id: 6,
    title: 'Quran Memorization - Juz 1',
    classId: 1,
    teacherId: 1,
    students: [1, 2, 4],
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
    teacherId: 2,
    students: [1, 3],
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
    teacherId: 4,
    students: [3, 4],
    start: '2025-02-24T15:00:00',
    end: '2025-02-24T15:55:00',
    type: 'class',
    status: 'scheduled',
    location: 'Room A2'
  }
];

// Analytics Mock Data
export const mockAnalytics = {
  admin: {
    totalUsers: 15,
    totalTeachers: 5,
    totalStudents: 5,
    totalParents: 4,
    totalClasses: 6,
    activeClasses: 5,
    revenue: 8500,
    monthlyGrowth: 15.2,
    userGrowthData: [
      { month: 'Sep', users: 8 },
      { month: 'Oct', users: 12 },
      { month: 'Nov', users: 14 },
      { month: 'Dec', users: 15 },
      { month: 'Jan', users: 15 },
      { month: 'Feb', users: 15 }
    ],
    revenueData: [
      { month: 'Sep', revenue: 2000 },
      { month: 'Oct', revenue: 4500 },
      { month: 'Nov', revenue: 6200 },
      { month: 'Dec', revenue: 7800 },
      { month: 'Jan', revenue: 8200 },
      { month: 'Feb', revenue: 8500 }
    ],
    classDistribution: [
      { name: 'Quran Memorization', students: 3, color: '#10B981' },
      { name: 'Arabic Language', students: 2, color: '#3B82F6' },
      { name: 'Islamic Studies', students: 3, color: '#8B5CF6' },
      { name: 'Tajweed', students: 2, color: '#F59E0B' },
      { name: 'Hadith Studies', students: 1, color: '#EF4444' }
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
  return mockClasses.filter(cls => cls.teacherId === teacherId);
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
  'Seerah (Prophet\'s Biography)'
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