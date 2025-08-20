// Mock Data for Baraem Al-Nour Management System

// Users Mock Data
export const mockUsers = {
  teachers: [
    {
      id: 101,
      firstName: 'Abdullah',
      lastName: 'Al-Mahmoud',
      fullName: 'Sheikh Abdullah Al-Mahmoud',
      email: 'abdullah@baraemalNoor.com',
      phone: '+966-50-123-4567',
      role: 'teacher',
      specialization: 'Quran Memorization',
      joinDate: '2023-01-15',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [1, 7] // Quran Juz 1, Quran Juz 2
    },
    {
      id: 102,
      firstName: 'Aisha',
      lastName: 'Al-Zahra',
      fullName: 'Ustadha Aisha Al-Zahra',
      email: 'aisha@baraemalNoor.com',
      phone: '+966-50-234-5678',
      role: 'teacher',
      specialization: 'Arabic Language',
      joinDate: '2023-02-20',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [2, 10] // Arabic Basics, Advanced Arabic
    },
    {
      id: 103,
      firstName: 'Omar',
      lastName: 'Al-Faruq',
      fullName: 'Sheikh Omar Al-Faruq',
      email: 'omar@baraemalNour.com',
      phone: '+966-50-345-6789',
      role: 'teacher',
      specialization: 'Islamic Studies',
      joinDate: '2023-03-10',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [3, 8] // Islamic Studies, Fiqh
    },
    {
      id: 104,
      firstName: 'Khadija',
      lastName: 'Al-Kubra',
      fullName: 'Ustadha Khadija Al-Kubra',
      email: 'khadija@baraemalNour.com',
      phone: '+966-50-456-7890',
      role: 'teacher',
      specialization: 'Tajweed',
      joinDate: '2023-04-05',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [4, 9] // Tajweed, Seerah
    },
    {
      id: 105,
      firstName: 'Hassan',
      lastName: 'Al-Basri',
      fullName: 'Sheikh Hassan Al-Basri',
      email: 'hassan@baraemalNour.com',
      phone: '+966-50-567-8901',
      role: 'teacher',
      specialization: 'Hadith Studies',
      joinDate: '2023-05-12',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [5, 11] // Hadith Studies, Quran Tafseer
    },
    {
      id: 106,
      firstName: 'Jane',
      lastName: 'Teacher',
      fullName: 'Jane Teacher',
      email: 'jane.teacher@education.com',
      phone: '+1-555-0002',
      role: 'teacher',
      specialization: 'Islamic History',
      joinDate: '2023-06-01',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [6, 12] // Islamic History, Islamic Ethics
    }
  ],
  students: [
    {
      id: 201,
      firstName: 'Ahmad',
      lastName: 'Al-Noor',
      fullName: 'Ahmad Al-Noor',
      email: 'ahmad@student.com',
      phone: '+966-50-111-2222',
      role: 'student',
      age: 12,
      parentId: 301,
      joinDate: '2023-09-01',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [1, 2, 6, 8, 11] // Quran Juz 1, Arabic Basics, Islamic History, Fiqh, Quran Tafseer
    },
    {
      id: 202,
      firstName: 'Fatima',
      lastName: 'Al-Zahra',
      fullName: 'Fatima Al-Zahra',
      email: 'fatima@student.com',
      phone: '+966-50-222-3333',
      role: 'student',
      age: 10,
      parentId: 301,
      joinDate: '2023-09-01',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [1, 3, 7, 8, 9, 12] // Quran Juz 1, Islamic Studies, Quran Juz 2, Fiqh, Seerah, Islamic Ethics
    },
    {
      id: 203,
      firstName: 'Yusuf',
      lastName: 'Al-Salam',
      fullName: 'Yusuf Al-Salam',
      email: 'yusuf@student.com',
      phone: '+966-50-333-4444',
      role: 'student',
      age: 14,
      parentId: 302,
      joinDate: '2023-09-15',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [2, 3, 4, 6, 8, 10, 11] // Arabic Basics, Islamic Studies, Tajweed, Islamic History, Fiqh, Advanced Arabic, Quran Tafseer
    },
    {
      id: 204,
      firstName: 'Maryam',
      lastName: 'Al-Siddiq',
      fullName: 'Maryam Al-Siddiq',
      email: 'maryam@student.com',
      phone: '+966-50-444-5555',
      role: 'student',
      age: 11,
      parentId: 303,
      joinDate: '2023-10-01',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [1, 4, 7, 8, 9, 12] // Quran Juz 1, Tajweed, Quran Juz 2, Fiqh, Seerah, Islamic Ethics
    },
    {
      id: 205,
      firstName: 'Omar',
      lastName: 'Al-Khattab',
      fullName: 'Omar Al-Khattab',
      email: 'omar@student.com',
      phone: '+966-50-555-6666',
      role: 'student',
      age: 13,
      parentId: 304,
      joinDate: '2023-10-15',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [3, 5, 8, 9, 11] // Islamic Studies, Hadith Studies, Fiqh, Seerah, Quran Tafseer
    },
    {
      id: 206,
      firstName: 'John',
      lastName: 'Student',
      fullName: 'John Student',
      email: 'john.student@education.com',
      phone: '+1-555-0003',
      role: 'student',
      age: 15,
      parentId: 305,
      joinDate: '2023-09-01',
      status: 'active',
      avatar: '/api/placeholder/40/40',
      courseIds: [1, 2, 6, 8] // Quran Juz 1, Arabic Basics, Islamic History, Fiqh
    }
  ],
  parents: [
    {
      id: 301,
      firstName: 'Abu Ahmad',
      lastName: 'Al-Noor',
      fullName: 'Abu Ahmad Al-Noor',
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
      firstName: 'Abu Yusuf',
      lastName: 'Al-Salam',
      fullName: 'Abu Yusuf Al-Salam',
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
      firstName: 'Abu Maryam',
      lastName: 'Al-Siddiq',
      fullName: 'Abu Maryam Al-Siddiq',
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
      firstName: 'Abu Omar',
      lastName: 'Al-Khattab',
      fullName: 'Abu Omar Al-Khattab',
      email: 'parent4@baraemalNour.com',
      phone: '+966-50-888-9999',
      role: 'parent',
      children: [205],
      joinDate: '2023-09-20',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 305,
      firstName: 'Mary',
      lastName: 'Parent',
      fullName: 'Mary Parent',
      email: 'mary.parent@education.com',
      phone: '+1-555-0004',
      role: 'parent',
      children: [206],
      joinDate: '2023-08-15',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    }
  ],
  admins: [
    {
      id: 401,
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      email: 'admin@baraemalNour.com',
      phone: '+966-50-999-0000',
      role: 'admin',
      joinDate: '2023-01-01',
      status: 'active',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 402,
      firstName: 'Demo',
      lastName: 'Admin',
      fullName: 'Demo Admin',
      email: 'admin@education.com',
      phone: '+1-555-0001',
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
    teacherId: 101,
    numberOfSessions: 2, // 2 sessions per week
    sessionDuration: 120, // 120 minutes per session
    price: 500, // SAR
    students: [201, 202, 204], // Ahmad, Fatima, Maryam
    description: 'Memorization of the first Juz of the Holy Quran with proper Tajweed',
    startDate: '2023-09-01',
    endDate: '2023-12-01',
    schedule: [
      {
        day: "Sunday",
        startTime: "16:00",
        endTime: "18:00"
      },
      {
        day: "Tuesday",
        startTime: "16:00",
        endTime: "18:00"
      }
    ]
  },
  {
    id: 2,
    name: 'Arabic Language Basics',
    teacherId: 102,
    numberOfSessions: 2,
    sessionDuration: 120,
    price: 400,
    students: [201, 203], // Ahmad, Yusuf
    description: 'Basic Arabic reading, writing, and grammar for beginners',
    startDate: '2023-09-05',
    endDate: '2023-11-30',
    schedule: [
      {
        day: "Monday",
        startTime: "17:00",
        endTime: "19:00"
      },
      {
        day: "Wednesday",
        startTime: "17:00",
        endTime: "19:00"
      }
    ]
  },
  {
    id: 3,
    name: 'Islamic Studies Foundation',
    teacherId: 103,
    numberOfSessions: 2,
    sessionDuration: 120,
    price: 350,
    students: [202, 203, 205], // Fatima, Yusuf, Omar
    description: 'Introduction to Islamic history, principles, and values',
    startDate: '2023-09-10',
    endDate: '2023-11-25',
    schedule: [
      {
        day: "Thursday",
        startTime: "18:00",
        endTime: "20:00"
      },
      {
        day: "Friday",
        startTime: "18:00",
        endTime: "20:00"
      }
    ]
  },
  {
    id: 4,
    name: 'Tajweed Mastery',
    teacherId: 104,
    numberOfSessions: 2,
    sessionDuration: 120,
    price: 450,
    students: [203, 204], // Yusuf, Maryam
    description: 'Master the art of Quranic recitation with proper pronunciation and rules',
    startDate: '2023-10-01',
    endDate: '2023-12-15',
    schedule: [
      {
        day: "Saturday",
        startTime: "15:00",
        endTime: "17:00"
      },
      {
        day: "Monday",
        startTime: "15:00",
        endTime: "17:00"
      }
    ]
  },
  {
    id: 5,
    name: 'Hadith Studies',
    teacherId: 105,
    numberOfSessions: 2,
    sessionDuration: 120,
    price: 300,
    students: [205], // Omar
    description: 'Study of authentic Hadith collections and their interpretations',
    startDate: '2023-10-15',
    endDate: '2023-12-20',
    schedule: [
      {
        day: "Wednesday",
        startTime: "19:00",
        endTime: "21:00"
      },
      {
        day: "Friday",
        startTime: "19:00",
        endTime: "21:00"
      }
    ]
  },
  {
    id: 6,
    name: 'Islamic History',
    teacherId: 106,
    numberOfSessions: 2,
    sessionDuration: 120,
    price: 250,
    students: [201, 203], // Ahmad, Yusuf
    description: 'Introduction to Islamic history and its significance',
    startDate: '2023-11-01',
    endDate: '2023-12-31',
    schedule: [
      {
        day: "Tuesday",
        startTime: "18:00",
        endTime: "20:00"
      },
      {
        day: "Thursday",
        startTime: "18:00",
        endTime: "20:00"
      }
    ]
  },
  {
    id: 7,
    name: 'Quran Memorization - Juz 2',
    teacherId: 101,
    numberOfSessions: 2,
    sessionDuration: 120,
    price: 500,
    students: [202, 204], // Fatima, Maryam (advanced students)
    description: 'Memorization of the second Juz of the Holy Quran',
    startDate: '2024-01-01',
    endDate: '2024-04-01',
    schedule: [
      {
        day: "Sunday",
        startTime: "17:00",
        endTime: "19:00"
      },
      {
        day: "Tuesday",
        startTime: "17:00",
        endTime: "19:00"
      }
    ]
  },
  {
    id: 8,
    name: 'Fiqh (Islamic Jurisprudence)',
    teacherId: 103,
    numberOfSessions: 2,
    sessionDuration: 120,
    price: 400,
    students: [201, 202, 203, 204, 205], // All students
    description: 'Study of Islamic law and legal principles',
    startDate: '2024-01-15',
    endDate: '2024-04-15',
    schedule: [
      {
        day: "Monday",
        startTime: "16:00",
        endTime: "18:00"
      },
      {
        day: "Thursday",
        startTime: "16:00",
        endTime: "18:00"
      }
    ]
  },
  {
    id: 9,
    name: 'Seerah (Prophet\'s Biography)',
    teacherId: 104,
    numberOfSessions: 2,
    sessionDuration: 120,
    price: 350,
    students: [202, 204, 205], // Fatima, Maryam, Omar
    description: 'Life and teachings of Prophet Muhammad (PBUH)',
    startDate: '2024-02-01',
    endDate: '2024-05-01',
    schedule: [
      {
        day: "Wednesday",
        startTime: "17:00",
        endTime: "19:00"
      },
      {
        day: "Saturday",
        startTime: "17:00",
        endTime: "19:00"
      }
    ]
  },
  {
    id: 10,
    name: 'Advanced Arabic Grammar',
    teacherId: 102,
    numberOfSessions: 2,
    sessionDuration: 120,
    price: 450,
    students: [203], // Yusuf (advanced level)
    description: 'Advanced Arabic grammar and composition',
    startDate: '2024-01-20',
    endDate: '2024-04-20',
    schedule: [
      {
        day: "Tuesday",
        startTime: "16:00",
        endTime: "18:00"
      },
      {
        day: "Friday",
        startTime: "16:00",
        endTime: "18:00"
      }
    ]
  },
  {
    id: 11,
    name: 'Quran Tafseer (Interpretation)',
    teacherId: 105,
    numberOfSessions: 2,
    sessionDuration: 120,
    price: 500,
    students: [201, 203, 205], // Ahmad, Yusuf, Omar
    description: 'Deep study of Quranic meanings and interpretations',
    startDate: '2024-02-15',
    endDate: '2024-05-15',
    schedule: [
      {
        day: "Saturday",
        startTime: "18:00",
        endTime: "20:00"
      },
      {
        day: "Sunday",
        startTime: "18:00",
        endTime: "20:00"
      }
    ]
  },
  {
    id: 12,
    name: 'Islamic Ethics & Morality',
    teacherId: 106,
    numberOfSessions: 2,
    sessionDuration: 120,
    price: 300,
    students: [202, 204], // Fatima, Maryam
    description: 'Islamic values, ethics, and character building',
    startDate: '2024-03-01',
    endDate: '2024-05-31',
    schedule: [
      {
        day: "Monday",
        startTime: "18:00",
        endTime: "20:00"
      },
      {
        day: "Wednesday",
        startTime: "18:00",
        endTime: "20:00"
      }
    ]
  }
];

// Analytics Mock Data
export const mockAnalytics = {
  admin: {
    totalUsers: 16,
    totalTeachers: 6,
    totalStudents: 6,
    totalParents: 5,
    totalClasses: 12,
    activeClasses: 12,
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
      { name: 'Quran Memorization - Juz 1', students: 3, color: '#10B981' },
      { name: 'Arabic Language Basics', students: 2, color: '#3B82F6' },
      { name: 'Islamic Studies Foundation', students: 3, color: '#8B5CF6' },
      { name: 'Tajweed Mastery', students: 2, color: '#F59E0B' },
      { name: 'Hadith Studies', students: 1, color: '#EF4444' },
      { name: 'Islamic History', students: 2, color: '#06B6D4' },
      { name: 'Quran Memorization - Juz 2', students: 2, color: '#10B981' },
      { name: 'Fiqh (Islamic Jurisprudence)', students: 5, color: '#8B5A2B' },
      { name: 'Seerah (Prophet\'s Biography)', students: 3, color: '#FF69B4' },
      { name: 'Advanced Arabic Grammar', students: 1, color: '#32CD32' },
      { name: 'Quran Tafseer (Interpretation)', students: 3, color: '#FF4500' },
      { name: 'Islamic Ethics & Morality', students: 2, color: '#9370DB' }
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
export const formatScheduleDisplay = (schedule) => {
  if (!schedule || schedule.length === 0) return 'Schedule TBD';
  
  // Convert 24-hour format to 12-hour format for display
  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };
  
  if (schedule.length === 1) {
    const session = schedule[0];
    const timeDisplay = `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`;
    return `${session.day} ${timeDisplay}`;
  } else if (schedule.length === 2) {
    const timeDisplay = `${formatTime(schedule[0].startTime)} - ${formatTime(schedule[0].endTime)}`;
    return `${schedule[0].day} & ${schedule[1].day} ${timeDisplay}`;
  } else {
    const lastDay = schedule[schedule.length - 1].day;
    const otherDays = schedule.slice(0, -1).map(s => s.day);
    const timeDisplay = `${formatTime(schedule[0].startTime)} - ${formatTime(schedule[0].endTime)}`;
    return `${otherDays.join(', ')} & ${lastDay} ${timeDisplay}`;
  }
};

// Helper function to check if a course is scheduled on a specific day
export const isCourseScheduledOnDay = (course, dayName) => {
  return course.schedule && course.schedule.some(session => session.day === dayName);
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