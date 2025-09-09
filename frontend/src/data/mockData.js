// Mock Data Structure - Mimics Database Schema
// This file contains all mock data for components that don't have backend endpoints

// Users Data
export const mockUsers = [
  {
    id: '1',
    firstName: 'Ahmed',
    lastName: 'Al-Rashid',
    email: 'ahmed.alrashid@example.com',
    role: 'admin',
    phone: '+966501234567',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    avatar: null
  },
  {
    id: '2',
    firstName: 'Fatima',
    lastName: 'Al-Zahra',
    email: 'fatima.alzahra@example.com',
    role: 'teacher',
    phone: '+966502345678',
    isActive: true,
    createdAt: '2024-01-20T09:30:00Z',
    avatar: null
  },
  {
    id: '3',
    firstName: 'Omar',
    lastName: 'Al-Hassan',
    email: 'omar.alhassan@example.com',
    role: 'parent',
    phone: '+966503456789',
    isActive: true,
    createdAt: '2024-02-01T14:15:00Z',
    avatar: null
  },
  {
    id: '4',
    firstName: 'Aisha',
    lastName: 'Al-Mahmoud',
    email: 'aisha.almahmoud@example.com',
    role: 'student',
    phone: '+966504567890',
    isActive: true,
    createdAt: '2024-02-10T11:45:00Z',
    avatar: null
  },
  {
    id: '5',
    firstName: 'Yusuf',
    lastName: 'Al-Khalil',
    email: 'yusuf.alkhalil@example.com',
    role: 'teacher',
    phone: '+966505678901',
    isActive: true,
    createdAt: '2024-02-15T16:20:00Z',
    avatar: null
  },
  {
    id: '6',
    firstName: 'Hassan',
    lastName: 'Al-Rahman',
    email: 'hassan.alrahman@example.com',
    role: 'student',
    phone: '+966506789012',
    isActive: true,
    createdAt: '2024-02-20T12:00:00Z',
    avatar: null
  },
  {
    id: '7',
    firstName: 'Layla',
    lastName: 'Al-Sabah',
    email: 'layla.alsabah@example.com',
    role: 'parent',
    phone: '+966507890123',
    isActive: true,
    createdAt: '2024-02-25T15:30:00Z',
    avatar: null
  },
  {
    id: '8',
    firstName: 'Zainab',
    lastName: 'Al-Fatima',
    email: 'zainab.alfatima@example.com',
    role: 'student',
    phone: '+966508901234',
    isActive: true,
    createdAt: '2024-03-01T10:15:00Z',
    avatar: null
  }
];

// Courses/Classes Data
export const mockCourses = [
  {
    id: '1',
    name: 'Islamic Studies - Level 1',
    description: 'Basic Islamic education covering Quran, Hadith, and Islamic history',
    teacherId: '3fe2783f-08fa-41e2-87ce-bb531b91e73b',
    teacher: {
      id: '3fe2783f-08fa-41e2-87ce-bb531b91e73b',
      name: 'Current Teacher'
    },
    students: [
      { id: '4', name: 'Aisha Al-Mahmoud' },
      { id: '6', name: 'Hassan Al-Rahman' }
    ],
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    schedule: [
      { day: 'Monday', startTime: '09:00', endTime: '10:30' },
      { day: 'Wednesday', startTime: '09:00', endTime: '10:30' }
    ],
    price: 150.00,
    status: 'active',
    createdAt: '2024-02-20T08:00:00Z'
  },
  {
    id: '2',
    name: 'Arabic Language - Beginner',
    description: 'Learn Arabic alphabet, basic vocabulary, and simple conversations',
    teacherId: '5',
    teacher: {
      id: '5',
      name: 'Yusuf Al-Khalil'
    },
    students: [
      { id: '4', name: 'Aisha Al-Mahmoud' }
    ],
    startDate: '2024-03-15',
    endDate: '2024-07-15',
    schedule: [
      { day: 'Tuesday', startTime: '14:00', endTime: '15:30' },
      { day: 'Thursday', startTime: '14:00', endTime: '15:30' }
    ],
    price: 120.00,
    status: 'active',
    createdAt: '2024-02-25T10:30:00Z'
  },
  {
    id: '3',
    name: 'Quran Recitation - Tajweed',
    description: 'Advanced Quran recitation with proper tajweed rules and pronunciation',
    teacherId: '3fe2783f-08fa-41e2-87ce-bb531b91e73b',
    teacher: {
      id: '3fe2783f-08fa-41e2-87ce-bb531b91e73b',
      name: 'Current Teacher'
    },
    students: [
      { id: '6', name: 'Hassan Al-Rahman' },
      { id: '8', name: 'Zainab Al-Fatima' }
    ],
    startDate: '2024-04-01',
    endDate: '2024-08-31',
    schedule: [
      { day: 'Sunday', startTime: '10:00', endTime: '11:30' },
      { day: 'Thursday', startTime: '10:00', endTime: '11:30' }
    ],
    price: 200.00,
    status: 'active',
    createdAt: '2024-03-10T09:15:00Z'
  },
  {
    id: '4',
    name: 'Islamic History & Culture',
    description: 'Comprehensive study of Islamic civilization, achievements, and cultural heritage',
    teacherId: '5',
    teacher: {
      id: '5',
      name: 'Yusuf Al-Khalil'
    },
    students: [
      { id: '4', name: 'Aisha Al-Mahmoud' },
      { id: '8', name: 'Zainab Al-Fatima' }
    ],
    startDate: '2024-05-01',
    endDate: '2024-09-30',
    schedule: [
      { day: 'Saturday', startTime: '15:00', endTime: '16:30' }
    ],
    price: 180.00,
    status: 'active',
    createdAt: '2024-04-15T11:45:00Z'
  },
  {
    id: '5',
    name: 'Arabic Grammar - Intermediate',
    description: 'Intermediate Arabic grammar, sentence structure, and writing skills',
    teacherId: '5',
    teacher: {
      id: '5',
      name: 'Yusuf Al-Khalil'
    },
    students: [],
    startDate: '2024-06-01',
    endDate: '2024-10-31',
    schedule: [
      { day: 'Monday', startTime: '16:00', endTime: '17:30' },
      { day: 'Wednesday', startTime: '16:00', endTime: '17:30' }
    ],
    price: 160.00,
    status: 'active',
    createdAt: '2024-05-20T14:20:00Z'
  },
  {
    id: '6',
    name: 'Hadith Studies - Foundation',
    description: 'Introduction to Hadith sciences, authentication, and interpretation',
    teacherId: '2',
    teacher: {
      id: '2',
      name: 'Fatima Al-Zahra'
    },
    students: [],
    startDate: '2024-07-01',
    endDate: '2024-11-30',
    schedule: [
      { day: 'Tuesday', startTime: '11:00', endTime: '12:30' },
      { day: 'Friday', startTime: '11:00', endTime: '12:30' }
    ],
    price: 175.00,
    status: 'active',
    createdAt: '2024-06-10T10:30:00Z'
  },
  {
    id: '7',
    name: 'Advanced Islamic Studies',
    description: 'Comprehensive advanced course covering multiple Islamic disciplines',
    teacherId: '3fe2783f-08fa-41e2-87ce-bb531b91e73b',
    teacher: {
      id: '3fe2783f-08fa-41e2-87ce-bb531b91e73b',
      name: 'Current Teacher'
    },
    students: [
      { id: '4', name: 'Aisha Al-Mahmoud' },
      { id: '6', name: 'Hassan Al-Rahman' },
      { id: '8', name: 'Zainab Al-Fatima' }
    ],
    startDate: '2024-08-01',
    endDate: '2024-12-31',
    schedule: [
      { day: 'Monday', startTime: '14:00', endTime: '15:30' },
      { day: 'Wednesday', startTime: '14:00', endTime: '15:30' }
    ],
    price: 250.00,
    status: 'active',
    createdAt: '2024-06-15T10:00:00Z'
  }
];

// Student Progress Data
export const mockStudentProgress = {
  '4': { // Aisha's progress
    courses: [
      {
        id: '1',
        title: 'Islamic Studies - Level 1',
        instructor_name: 'Current Teacher',
        progress_percentage: 75,
        attended_sessions: 12,
        total_sessions: 16,
        graded_assignments: 8,
        total_assignments: 10,
        avg_grade_percentage: 88
      },
      {
        id: '2',
        title: 'Arabic Language - Beginner',
        instructor_name: 'Yusuf Al-Khalil',
        progress_percentage: 60,
        attended_sessions: 8,
        total_sessions: 12,
        graded_assignments: 5,
        total_assignments: 8,
        avg_grade_percentage: 82
      }
    ],
    recentGrades: [
      {
        id: '1',
        assignment_title: 'Quran Recitation Test',
        course_title: 'Islamic Studies - Level 1',
        assignment_type: 'Test',
        grade: 18,
        max_points: 20,
        feedback: 'Excellent recitation with proper tajweed rules',
        graded_by_name: 'Current Teacher',
        graded_at: '2024-05-15T14:30:00Z'
      },
      {
        id: '2',
        assignment_title: 'Arabic Writing Assignment',
        course_title: 'Arabic Language - Beginner',
        assignment_type: 'Assignment',
        grade: 15,
        max_points: 20,
        feedback: 'Good effort, practice more on letter connections',
        graded_by_name: 'Yusuf Al-Khalil',
        graded_at: '2024-05-12T16:45:00Z'
      }
    ],
    attendanceSummary: [
      { status: 'present', count: 20, percentage: 83 },
      { status: 'absent', count: 3, percentage: 13 },
      { status: 'late', count: 1, percentage: 4 }
    ]
  }
};

// Teacher Data
export const mockTeacherData = {
  totalStudents: 8,
  totalCourses: 3,
  upcomingSessions: [
    {
      id: '1',
      courseName: 'Islamic Studies - Level 1',
      date: '2024-05-20',
      startTime: '09:00',
      endTime: '10:30',
      studentsCount: 12
    },
    {
      id: '2',
      courseName: 'Arabic Language - Beginner',
      date: '2024-05-21',
      startTime: '14:00',
      endTime: '15:30',
      studentsCount: 8
    }
  ],
  recentAssignments: [
    {
      id: '1',
      title: 'Quran Recitation Test',
      course: 'Islamic Studies - Level 1',
      dueDate: '2024-05-18',
      submittedCount: 10,
      totalCount: 12
    },
    {
      id: '2',
      title: 'Arabic Writing Assignment',
      course: 'Arabic Language - Beginner',
      dueDate: '2024-05-20',
      submittedCount: 6,
      totalCount: 8
    }
  ],
  studentPerformance: [
    {
      studentId: '4',
      studentName: 'Aisha Al-Mahmoud',
      course: 'Islamic Studies - Level 1',
      progress: 75,
      attendance: 83,
      avgGrade: 88
    }
  ]
};

// Admin Data
export const mockAdminData = {
  totalUsers: 1250,
  totalTeachers: 45,
  totalStudents: 980,
  totalClasses: 67,
  monthlyGrowth: {
    users: [120, 135, 142, 158, 165, 178, 185, 192, 210, 225, 238, 250],
    teachers: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    students: [95, 108, 115, 128, 135, 148, 155, 168, 175, 188, 195, 208],
    classes: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  },
  revenue: {
    monthly: [45000, 52000, 48000, 61000, 58000, 67000, 72000, 68000, 75000, 82000, 78000, 89000],
    total: 725000
  },
  classDistribution: [
    { level: 'Beginner', count: 25, percentage: 37 },
    { level: 'Intermediate', count: 28, percentage: 42 },
    { level: 'Advanced', count: 14, percentage: 21 }
  ],
  recentActivity: [
    {
      id: '1',
      type: 'user_registration',
      message: 'New student registered',
      user: 'Aisha Al-Mahmoud',
      timestamp: '2024-05-15T14:30:00Z',
      icon: 'UserPlus'
    },
    {
      id: '2',
      type: 'course_creation',
      message: 'New course created',
      user: 'Fatima Al-Zahra',
      timestamp: '2024-05-14T10:15:00Z',
      icon: 'BookOpen'
    },
    {
      id: '3',
      type: 'grade_submission',
      message: 'Grades submitted',
      user: 'Yusuf Al-Khalil',
      timestamp: '2024-05-13T16:45:00Z',
      icon: 'GraduationCap'
    }
  ]
};

// Parent Data
export const mockParentData = {
  children: [
    {
      id: '4',
      firstName: 'Aisha',
      lastName: 'Al-Mahmoud',
      email: 'aisha.almahmoud@example.com',
      enrolledClasses: mockCourses.filter(course => 
        course.students.some(student => student.id === '4')
      ),
      avgProgress: 67.5,
      attendedSessions: 20,
      totalSessions: 28,
      avgGradePercentage: 85,
      relationshipType: 'daughter'
    }
  ],
  upcomingSessions: [
    {
      id: '1',
      courseName: 'Islamic Studies - Level 1',
      date: '2024-05-20',
      startTime: '09:00',
      endTime: '10:30'
    },
    {
      id: '2',
      courseName: 'Arabic Language - Beginner',
      date: '2024-05-21',
      startTime: '14:00',
      endTime: '15:30'
    }
  ],
  recentGrades: [
    {
      id: '1',
      assignmentTitle: 'Quran Recitation Test',
      courseTitle: 'Islamic Studies - Level 1',
      grade: 18,
      maxPoints: 20,
      percentage: 90,
      date: '2024-05-15'
    }
  ]
};

// Student Data
export const mockStudentData = {
  enrolledCourses: mockCourses.filter(course => 
    course.students.some(student => student.id === '4')
  ),
  upcomingSessions: [
    {
      id: '1',
      courseName: 'Islamic Studies - Level 1',
      date: '2024-05-20',
      startTime: '09:00',
      endTime: '10:30',
      teacher: 'Fatima Al-Zahra'
    }
  ],
  recentAssignments: [
    {
      id: '1',
      title: 'Quran Recitation Test',
      course: 'Islamic Studies - Level 1',
      dueDate: '2024-05-18',
      status: 'completed',
      grade: '18/20'
    }
  ],
  progress: {
    overall: 67.5,
    courses: [
      {
        name: 'Islamic Studies - Level 1',
        progress: 75,
        attendance: 83
      },
      {
        name: 'Arabic Language - Beginner',
        progress: 60,
        attendance: 67
      }
    ]
  }
};

// Available Courses for Child Registration
export const mockAvailableCourses = [
  'Islamic Studies - Level 1',
  'Arabic Language - Beginner',
  'Quran Memorization',
  'Islamic History',
  'Islamic Ethics',
  'Arabic Calligraphy'
];

// ===== NEW MOCK DATA FOR REQUESTED COMPONENTS =====

// Admin Class Management Data (following backend schema)
export const mockAdminClassManagement = {
  classes: [
    {
      id: '1',
      name: 'Islamic Studies - Level 1',
      description: 'Basic Islamic education covering Quran, Hadith, and Islamic history',
      teacher: {
        id: '2',
        firstName: 'Fatima',
        lastName: 'Al-Zahra',
        email: 'fatima.alzahra@example.com',
        phone: '+966502345678'
      },
      students: [
        {
          id: '4',
          firstName: 'Aisha',
          lastName: 'Al-Mahmoud',
          email: 'aisha.almahmoud@example.com',
          parent: {
            id: '3',
            firstName: 'Omar',
            lastName: 'Al-Hassan',
            email: 'omar.alhassan@example.com'
          }
        },
        {
          id: '6',
          firstName: 'Hassan',
          lastName: 'Al-Rahman',
          email: 'hassan.alrahman@example.com',
          parent: null // Individual student
        }
      ],
      schedule: [
        {
          id: '1',
          day: 'Monday',
          startTime: '09:00',
          endTime: '10:30',
          room: 'A1'
        },
        {
          id: '2',
          day: 'Wednesday',
          startTime: '09:00',
          endTime: '10:30',
          room: 'A1'
        }
      ],
      status: 'active',
      maxStudents: 20,
      currentStudents: 2,
      startDate: '2024-03-01',
      endDate: '2024-06-30',
      createdAt: '2024-02-20T08:00:00Z',
      updatedAt: '2024-05-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Arabic Language - Beginner',
      description: 'Learn Arabic alphabet, basic vocabulary, and simple conversations',
      teacher: {
        id: '5',
        firstName: 'Yusuf',
        lastName: 'Al-Khalil',
        email: 'yusuf.alkhalil@example.com',
        phone: '+966505678901'
      },
      students: [
        {
          id: '4',
          firstName: 'Aisha',
          lastName: 'Al-Mahmoud',
          email: 'aisha.almahmoud@example.com',
          parent: {
            id: '3',
            firstName: 'Omar',
            lastName: 'Al-Hassan',
            email: 'omar.alhassan@example.com'
          }
        }
      ],
      schedule: [
        {
          id: '3',
          day: 'Tuesday',
          startTime: '14:00',
          endTime: '15:30',
          room: 'B2'
        },
        {
          id: '4',
          day: 'Thursday',
          startTime: '14:00',
          endTime: '15:30',
          room: 'B2'
        }
      ],
      status: 'active',
      maxStudents: 15,
      currentStudents: 1,
      startDate: '2024-03-15',
      endDate: '2024-07-15',
      createdAt: '2024-02-25T10:30:00Z',
      updatedAt: '2024-05-14T16:45:00Z'
    },
    {
      id: '3',
      name: 'Quran Memorization - Level 1',
      description: 'Memorize selected surahs with proper tajweed rules',
      teacher: {
        id: '2',
        firstName: 'Fatima',
        lastName: 'Al-Zahra',
        email: 'fatima.alzahra@example.com',
        phone: '+966502345678'
      },
      students: [],
      schedule: [
        {
          id: '5',
          day: 'Friday',
          startTime: '10:00',
          endTime: '11:30',
          room: 'C1'
        }
      ],
      status: 'pending',
      maxStudents: 12,
      currentStudents: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-01',
      createdAt: '2024-03-10T14:20:00Z',
      updatedAt: '2024-03-10T14:20:00Z'
    }
  ],
  teachers: [
    {
      id: '2',
      firstName: 'Fatima',
      lastName: 'Al-Zahra',
      email: 'fatima.alzahra@example.com',
      phone: '+966502345678',
      specialization: 'Islamic Studies, Quran',
      totalClasses: 2,
      totalStudents: 3
    },
    {
      id: '5',
      firstName: 'Yusuf',
      lastName: 'Al-Khalil',
      email: 'yusuf.alkhalil@example.com',
      phone: '+966505678901',
      specialization: 'Arabic Language',
      totalClasses: 1,
      totalStudents: 1
    }
  ],
  rooms: [
    { id: 'A1', name: 'Classroom A1', capacity: 25, floor: '1st Floor' },
    { id: 'A2', name: 'Classroom A2', capacity: 25, floor: '1st Floor' },
    { id: 'B1', name: 'Classroom B1', capacity: 20, floor: '2nd Floor' },
    { id: 'B2', name: 'Classroom B2', capacity: 20, floor: '2nd Floor' },
    { id: 'C1', name: 'Classroom C1', capacity: 15, floor: '3rd Floor' }
  ]
};

// Teacher Schedule Data (following backend schema)
export const mockTeacherSchedule = {
  teacherId: '2',
  teacherName: 'Fatima Al-Zahra',
  schedule: [
    {
      id: '1',
      courseId: '1',
      courseName: 'Islamic Studies - Level 1',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:30',
      room: 'A1',
      students: [
        {
          id: '4',
          firstName: 'Aisha',
          lastName: 'Al-Mahmoud',
          attendance: 'present'
        },
        {
          id: '6',
          firstName: 'Hassan',
          lastName: 'Al-Rahman',
          attendance: 'present'
        }
      ],
      date: '2024-05-20',
      status: 'scheduled'
    },
    {
      id: '2',
      courseId: '1',
      courseName: 'Islamic Studies - Level 1',
      day: 'Wednesday',
      startTime: '09:00',
      endTime: '10:30',
      room: 'A1',
      students: [
        {
          id: '4',
          firstName: 'Aisha',
          lastName: 'Al-Mahmoud',
          attendance: 'pending'
        },
        {
          id: '6',
          firstName: 'Hassan',
          lastName: 'Al-Rahman',
          attendance: 'pending'
        }
      ],
      date: '2024-05-22',
      status: 'scheduled'
    },
    {
      id: '5',
      courseId: '3',
      courseName: 'Quran Memorization - Level 1',
      day: 'Friday',
      startTime: '10:00',
      endTime: '11:30',
      room: 'C1',
      students: [],
      date: '2024-05-24',
      status: 'scheduled'
    }
  ],
  upcomingSessions: [
    {
      id: '1',
      courseName: 'Islamic Studies - Level 1',
      date: '2024-05-20',
      startTime: '09:00',
      endTime: '10:30',
      room: 'A1',
      studentsCount: 2
    },
    {
      id: '2',
      courseName: 'Islamic Studies - Level 1',
      date: '2024-05-22',
      startTime: '09:00',
      endTime: '10:30',
      room: 'A1',
      studentsCount: 2
    }
  ],
  timeSlots: [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:30' },
    { start: '10:30', end: '12:00' },
    { start: '14:00', end: '15:30' },
    { start: '15:30', end: '17:00' }
  ]
};

// Teacher Communications Data (following backend schema)
export const mockTeacherCommunications = {
  teacherId: '2',
  conversations: [
    {
      id: '1',
      participant: {
        id: '3',
        firstName: 'Omar',
        lastName: 'Al-Hassan',
        role: 'parent',
        email: 'omar.alhassan@example.com'
      },
      lastMessage: {
        id: '101',
        content: 'Thank you for the update on Aisha\'s progress',
        senderId: '3',
        senderName: 'Omar Al-Hassan',
        timestamp: '2024-05-15T16:30:00Z',
        isRead: true
      },
      unreadCount: 0,
      updatedAt: '2024-05-15T16:30:00Z'
    },
    {
      id: '2',
      participant: {
        id: '7',
        firstName: 'Layla',
        lastName: 'Al-Sabah',
        role: 'parent',
        email: 'layla.alsabah@example.com'
      },
      lastMessage: {
        id: '102',
        content: 'When will the next assignment be due?',
        senderId: '7',
        senderName: 'Layla Al-Sabah',
        timestamp: '2024-05-15T14:15:00Z',
        isRead: false
      },
      unreadCount: 1,
      updatedAt: '2024-05-15T14:15:00Z'
    }
  ],
  messages: {
    '1': [ // Conversation with Omar Al-Hassan
      {
        id: '101',
        content: 'Thank you for the update on Aisha\'s progress',
        senderId: '3',
        senderName: 'Omar Al-Hassan',
        timestamp: '2024-05-15T16:30:00Z',
        isRead: true
      },
      {
        id: '100',
        content: 'Aisha has shown excellent improvement in Quran recitation this week',
        senderId: '2',
        senderName: 'Fatima Al-Zahra',
        timestamp: '2024-05-15T16:00:00Z',
        isRead: true
      }
    ],
    '2': [ // Conversation with Layla Al-Sabah
      {
        id: '102',
        content: 'When will the next assignment be due?',
        senderId: '7',
        senderName: 'Layla Al-Sabah',
        timestamp: '2024-05-15T14:15:00Z',
        isRead: false
      },
      {
        id: '99',
        content: 'The Arabic writing assignment is due next Tuesday',
        senderId: '2',
        senderName: 'Fatima Al-Zahra',
        timestamp: '2024-05-15T14:00:00Z',
        isRead: true
      }
    ]
  },
  announcements: [
    {
      id: '1',
      title: 'Weekly Progress Report',
      content: 'All parents will receive weekly progress reports every Friday',
      targetAudience: 'parents',
      courseId: '1',
      courseName: 'Islamic Studies - Level 1',
      createdAt: '2024-05-15T10:00:00Z',
      isPublished: true
    },
    {
      id: '2',
      title: 'Holiday Schedule Update',
      content: 'Classes will be suspended during Eid holidays (June 15-17)',
      targetAudience: 'all',
      courseId: null,
      courseName: null,
      createdAt: '2024-05-14T15:30:00Z',
      isPublished: true
    }
  ]
};

// Parent Schedule Data (following backend schema)
export const mockParentSchedule = {
  parentId: '3',
  parentName: 'Omar Al-Hassan',
  children: [
    {
      id: '4',
      firstName: 'Aisha',
      lastName: 'Al-Mahmoud',
      email: 'aisha.almahmoud@example.com',
      schedule: [
        {
          id: '1',
          courseId: '1',
          courseName: 'Islamic Studies - Level 1',
          day: 'Monday',
          startTime: '09:00',
          endTime: '10:30',
          room: 'A1',
          teacher: {
            id: '2',
            firstName: 'Fatima',
            lastName: 'Al-Zahra'
          },
          date: '2024-05-20',
          status: 'upcoming'
        },
        {
          id: '2',
          courseId: '1',
          courseName: 'Islamic Studies - Level 1',
          day: 'Wednesday',
          startTime: '09:00',
          endTime: '10:30',
          room: 'A1',
          teacher: {
            id: '2',
            firstName: 'Fatima',
            lastName: 'Al-Zahra'
          },
          date: '2024-05-22',
          status: 'upcoming'
        },
        {
          id: '3',
          courseId: '2',
          courseName: 'Arabic Language - Beginner',
          day: 'Tuesday',
          startTime: '14:00',
          endTime: '15:30',
          room: 'B2',
          teacher: {
            id: '5',
            firstName: 'Yusuf',
            lastName: 'Al-Khalil'
          },
          date: '2024-05-21',
          status: 'upcoming'
        }
      ]
    }
  ],
  upcomingSessions: [
    {
      id: '1',
      childName: 'Aisha Al-Mahmoud',
      courseName: 'Islamic Studies - Level 1',
      date: '2024-05-20',
      startTime: '09:00',
      endTime: '10:30',
      room: 'A1',
      teacher: 'Fatima Al-Zahra'
    },
    {
      id: '2',
      childName: 'Aisha Al-Mahmoud',
      courseName: 'Islamic Studies - Level 1',
      date: '2024-05-22',
      startTime: '09:00',
      endTime: '10:30',
      room: 'A1',
      teacher: 'Fatima Al-Zahra'
    },
    {
      id: '3',
      childName: 'Aisha Al-Mahmoud',
      courseName: 'Arabic Language - Beginner',
      date: '2024-05-21',
      startTime: '14:00',
      endTime: '15:30',
      room: 'B2',
      teacher: 'Yusuf Al-Khalil'
    }
  ],
  calendar: {
    currentMonth: 'May 2024',
    events: [
      {
        id: '1',
        title: 'Islamic Studies - Aisha',
        date: '2024-05-20',
        startTime: '09:00',
        endTime: '10:30',
        type: 'class',
        childId: '4'
      },
      {
        id: '2',
        title: 'Arabic Language - Aisha',
        date: '2024-05-21',
        startTime: '14:00',
        endTime: '15:30',
        type: 'class',
        childId: '4'
      }
    ]
  }
};

// Parent Communications Data (following backend schema)
export const mockParentCommunications = {
  parentId: '3',
  parentName: 'Omar Al-Hassan',
  conversations: [
    {
      id: '1',
      participant: {
        id: '2',
        firstName: 'Fatima',
        lastName: 'Al-Zahra',
        role: 'teacher',
        email: 'fatima.alzahra@example.com'
      },
      lastMessage: {
        id: '101',
        content: 'Thank you for the update on Aisha\'s progress',
        senderId: '3',
        senderName: 'Omar Al-Hassan',
        timestamp: '2024-05-15T16:30:00Z',
        isRead: true
      },
      unreadCount: 0,
      updatedAt: '2024-05-15T16:30:00Z'
    },
    {
      id: '2',
      participant: {
        id: '5',
        firstName: 'Yusuf',
        lastName: 'Al-Khalil',
        role: 'teacher',
        email: 'yusuf.alkhalil@example.com'
      },
      lastMessage: {
        id: '103',
        content: 'Aisha is doing well in Arabic class',
        senderId: '5',
        senderName: 'Yusuf Al-Khalil',
        timestamp: '2024-05-15T12:00:00Z',
        isRead: false
      },
      unreadCount: 1,
      updatedAt: '2024-05-15T12:00:00Z'
    }
  ],
  messages: {
    '1': [ // Conversation with Fatima Al-Zahra
      {
        id: '101',
        content: 'Thank you for the update on Aisha\'s progress',
        senderId: '3',
        senderName: 'Omar Al-Hassan',
        timestamp: '2024-05-15T16:30:00Z',
        isRead: true
      },
      {
        id: '100',
        content: 'Aisha has shown excellent improvement in Quran recitation this week',
        senderId: '2',
        senderName: 'Fatima Al-Zahra',
        timestamp: '2024-05-15T16:00:00Z',
        isRead: true
      }
    ],
    '2': [ // Conversation with Yusuf Al-Khalil
      {
        id: '103',
        content: 'Aisha is doing well in Arabic class',
        senderId: '5',
        senderName: 'Yusuf Al-Khalil',
        timestamp: '2024-05-15T12:00:00Z',
        isRead: false
      },
      {
        id: '102',
        content: 'How is Aisha progressing in Arabic?',
        senderId: '3',
        senderName: 'Omar Al-Hassan',
        timestamp: '2024-05-15T11:45:00Z',
        isRead: true
      }
    ]
  },
  announcements: [
    {
      id: '1',
      title: 'Weekly Progress Report',
      content: 'All parents will receive weekly progress reports every Friday',
      sender: 'Fatima Al-Zahra',
      courseName: 'Islamic Studies - Level 1',
      createdAt: '2024-05-15T10:00:00Z',
      isRead: false
    },
    {
      id: '2',
      title: 'Holiday Schedule Update',
      content: 'Classes will be suspended during Eid holidays (June 15-17)',
      sender: 'System',
      courseName: null,
      createdAt: '2024-05-14T15:30:00Z',
      isRead: true
    }
  ]
};

// Student Classes Data (following backend schema)
export const mockStudentClasses = {
  studentId: '4',
  studentName: 'Aisha Al-Mahmoud',
  enrolledCourses: [
    {
      id: '1',
      name: 'Islamic Studies - Level 1',
      description: 'Basic Islamic education covering Quran, Hadith, and Islamic history',
      teacher: {
        id: '2',
        firstName: 'Fatima',
        lastName: 'Al-Zahra',
        email: 'fatima.alzahra@example.com'
      },
      schedule: [
        {
          id: '1',
          day: 'Monday',
          startTime: '09:00',
          endTime: '10:30',
          room: 'A1'
        },
        {
          id: '2',
          day: 'Wednesday',
          startTime: '09:00',
          endTime: '10:30',
          room: 'A1'
        }
      ],
      progress: {
        overall: 75,
        attendance: 83,
        assignments: {
          completed: 8,
          total: 10,
          averageGrade: 88
        }
      },
      materials: [
        {
          id: '1',
          title: 'Quran Recitation Guide',
          type: 'document',
          uploadedAt: '2024-05-10T10:00:00Z',
          size: '2.5 MB'
        },
        {
          id: '2',
          title: 'Islamic History Notes',
          type: 'document',
          uploadedAt: '2024-05-12T14:30:00Z',
          size: '1.8 MB'
        }
      ],
      startDate: '2024-03-01',
      endDate: '2024-06-30',
      status: 'active'
    },
    {
      id: '2',
      name: 'Arabic Language - Beginner',
      description: 'Learn Arabic alphabet, basic vocabulary, and simple conversations',
      teacher: {
        id: '5',
        firstName: 'Yusuf',
        lastName: 'Al-Khalil',
        email: 'yusuf.alkhalil@example.com'
      },
      schedule: [
        {
          id: '3',
          day: 'Tuesday',
          startTime: '14:00',
          endTime: '15:30',
          room: 'B2'
        },
        {
          id: '4',
          day: 'Thursday',
          startTime: '14:00',
          endTime: '15:30',
          room: 'B2'
        }
      ],
      progress: {
        overall: 60,
        attendance: 67,
        assignments: {
          completed: 5,
          total: 8,
          averageGrade: 82
        }
      },
      materials: [
        {
          id: '3',
          title: 'Arabic Alphabet Chart',
          type: 'image',
          uploadedAt: '2024-05-08T09:15:00Z',
          size: '500 KB'
        },
        {
          id: '4',
          title: 'Basic Vocabulary List',
          type: 'document',
          uploadedAt: '2024-05-09T11:45:00Z',
          size: '1.2 MB'
        }
      ],
      startDate: '2024-03-15',
      endDate: '2024-07-15',
      status: 'active'
    }
  ],
  availableCourses: [
    {
      id: '3',
      name: 'Quran Memorization - Level 1',
      description: 'Memorize selected surahs with proper tajweed rules',
      teacher: {
        id: '2',
        firstName: 'Fatima',
        lastName: 'Al-Zahra'
      },
      schedule: [
        {
          day: 'Friday',
          startTime: '10:00',
          endTime: '11:30',
          room: 'C1'
        }
      ],
      maxStudents: 12,
      currentStudents: 0,
      startDate: '2024-04-01',
      endDate: '2024-07-01'
    }
  ]
};

// Student Schedule Data (following backend schema)
export const mockStudentSchedule = {
  studentId: '4',
  studentName: 'Aisha Al-Mahmoud',
  schedule: [
    {
      id: '1',
      courseId: '1',
      courseName: 'Islamic Studies - Level 1',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:30',
      room: 'A1',
      teacher: {
        id: '2',
        firstName: 'Fatima',
        lastName: 'Al-Zahra'
      },
      date: '2024-05-20',
      status: 'upcoming'
    },
    {
      id: '2',
      courseId: '1',
      courseName: 'Islamic Studies - Level 1',
      day: 'Wednesday',
      startTime: '09:00',
      endTime: '10:30',
      room: 'A1',
      teacher: {
        id: '2',
        firstName: 'Fatima',
        lastName: 'Al-Zahra'
      },
      date: '2024-05-22',
      status: 'upcoming'
    },
    {
      id: '3',
      courseId: '2',
      courseName: 'Arabic Language - Beginner',
      day: 'Tuesday',
      startTime: '14:00',
      endTime: '15:30',
      room: 'B2',
      teacher: {
        id: '5',
        firstName: 'Yusuf',
        lastName: 'Al-Khalil'
      },
      date: '2024-05-21',
      status: 'upcoming'
    }
  ],
  upcomingSessions: [
    {
      id: '1',
      courseName: 'Islamic Studies - Level 1',
      date: '2024-05-20',
      startTime: '09:00',
      endTime: '10:30',
      room: 'A1',
      teacher: 'Fatima Al-Zahra'
    },
    {
      id: '2',
      courseName: 'Islamic Studies - Level 1',
      date: '2024-05-22',
      startTime: '09:00',
      endTime: '10:30',
      room: 'A1',
      teacher: 'Fatima Al-Zahra'
    },
    {
      id: '3',
      courseName: 'Arabic Language - Beginner',
      date: '2024-05-21',
      startTime: '14:00',
      endTime: '15:30',
      room: 'B2',
      teacher: 'Yusuf Al-Khalil'
    }
  ],
  calendar: {
    currentMonth: 'May 2024',
    events: [
      {
        id: '1',
        title: 'Islamic Studies',
        date: '2024-05-20',
        startTime: '09:00',
        endTime: '10:30',
        type: 'class',
        courseId: '1'
      },
      {
        id: '2',
        title: 'Arabic Language',
        date: '2024-05-21',
        startTime: '14:00',
        endTime: '15:30',
        type: 'class',
        courseId: '2'
      }
    ]
  },
  timeSlots: [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:30' },
    { start: '10:30', end: '12:00' },
    { start: '14:00', end: '15:30' },
    { start: '15:30', end: '17:00' }
  ]
};

// Helper function to get mock data by type
export const getMockData = (type, filters = {}) => {
  switch (type) {
    case 'users':
      return mockUsers;
    case 'courses':
      return mockCourses;
    case 'studentProgress':
      return mockStudentProgress[filters.studentId] || null;
    case 'teacherData':
      return mockTeacherData;
    case 'adminData':
      return mockAdminData;
    case 'parentData':
      return mockParentData;
    case 'studentData':
      return mockStudentData;
    case 'availableCourses':
      return mockAvailableCourses;
    // New mock data types
    case 'adminClassManagement':
      return mockAdminClassManagement;
    case 'teacherSchedule':
      return mockTeacherSchedule;
    case 'teacherCommunications':
      return mockTeacherCommunications;
    case 'parentSchedule':
      return mockParentSchedule;
    case 'parentCommunications':
      return mockParentCommunications;
    case 'studentClasses':
      return mockStudentClasses;
    case 'studentSchedule':
      return mockStudentSchedule;
    default:
      return null;
  }
};
