import { AppDataSource } from '../data-source';
import { SubscriptionPlan, PlanType, BillingInterval } from '../modules/payments/entities/subscription-plan.entity';

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...');

  try {
    await AppDataSource.initialize();
    const planRepository = AppDataSource.getRepository(SubscriptionPlan);

    // Clear existing plans (optional - comment out if you want to keep existing)
    // await planRepository.clear();

    const plans = [
      // Base Monthly Subscription
      {
        name: 'Monthly Base Subscription',
        description: 'Access to all group classes, online materials, and progress tracking. Perfect for regular students.',
        planType: PlanType.RECURRING,
        billingInterval: BillingInterval.MONTH,
        price: 5000, // $50.00
        currency: 'usd',
        isBasePlan: true,
        isActive: true,
        maxStudents: 3,
        features: [
          'Access to all group classes',
          'Online learning materials',
          'Progress tracking',
          'Monthly reports',
          'Community forum access'
        ],
        category: 'Base Plans',
        displayOrder: 1
      },

      // Yearly Subscription (with discount)
      {
        name: 'Yearly Base Subscription',
        description: 'Save 20% with our annual subscription! All the benefits of monthly, billed once per year.',
        planType: PlanType.RECURRING,
        billingInterval: BillingInterval.YEAR,
        price: 48000, // $480.00 (save $120 vs monthly)
        currency: 'usd',
        isBasePlan: true,
        isActive: true,
        maxStudents: 3,
        features: [
          'All Monthly features',
          'Save 20% ($120/year)',
          'Priority support',
          'Free webinar access'
        ],
        category: 'Base Plans',
        displayOrder: 2
      },

      // 1-on-1 Quran Sessions (Add-on)
      {
        name: '1-on-1 Quran Sessions (10 lessons)',
        description: 'Private Quran tutoring with certified teachers. Personalized attention and flexible scheduling.',
        planType: PlanType.ADD_ON,
        billingInterval: BillingInterval.MONTH,
        price: 15000, // $150.00
        currency: 'usd',
        isBasePlan: false,
        isActive: true,
        maxStudents: 1,
        features: [
          '10 private sessions per month',
          'Certified Quran teacher',
          'Flexible scheduling',
          'Progress reports',
          'Tajweed correction'
        ],
        category: 'Quran 1-to-1',
        displayOrder: 10
      },

      // 1-on-1 Arabic Sessions
      {
        name: '1-on-1 Arabic Language (8 lessons)',
        description: 'Private Arabic language instruction tailored to your child\'s level and goals.',
        planType: PlanType.ADD_ON,
        billingInterval: BillingInterval.MONTH,
        price: 12000, // $120.00
        currency: 'usd',
        isBasePlan: false,
        isActive: true,
        maxStudents: 1,
        features: [
          '8 private sessions per month',
          'Native Arabic speaker',
          'Customized curriculum',
          'Speaking practice',
          'Homework and exercises'
        ],
        category: 'Language Learning',
        displayOrder: 11
      },

      // Summer Quran Camp
      {
        name: 'Summer Quran Intensive 2025',
        description: 'Three-month intensive Quran program during summer break. Help your child memorize and perfect their Quran recitation.',
        planType: PlanType.ONE_TIME,
        billingInterval: BillingInterval.ONE_TIME,
        price: 30000, // $300.00
        currency: 'usd',
        isBasePlan: false,
        isActive: true,
        maxEnrollments: 50,
        currentEnrollments: 0,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-08-31'),
        features: [
          'Daily online classes (Mon-Fri)',
          'Memorization techniques',
          'Tajweed perfection',
          'Certificate of completion',
          'Progress tracking',
          'Parent updates'
        ],
        category: 'Special Events',
        displayOrder: 20
      },

      // Ramadan Special Program
      {
        name: 'Ramadan Spiritual Journey 2025',
        description: 'One-month special program during Ramadan focusing on Quran, prayers, and Islamic values.',
        planType: PlanType.ONE_TIME,
        billingInterval: BillingInterval.ONE_TIME,
        price: 8000, // $80.00
        currency: 'usd',
        isBasePlan: false,
        isActive: true,
        maxEnrollments: 100,
        currentEnrollments: 0,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-31'),
        features: [
          'Daily Quran reflection',
          'Prayer techniques',
          'Islamic values lessons',
          'Family activities',
          'Ramadan planner',
          'Certificate of completion'
        ],
        category: 'Special Events',
        displayOrder: 21
      },

      // Islamic Studies Weekend Workshop
      {
        name: 'Islamic Studies Weekend Workshop',
        description: 'Comprehensive 2-day workshop covering essential Islamic knowledge for kids and teens.',
        planType: PlanType.ONE_TIME,
        billingInterval: BillingInterval.ONE_TIME,
        price: 5000, // $50.00
        currency: 'usd',
        isBasePlan: false,
        isActive: true,
        maxEnrollments: 30,
        currentEnrollments: 0,
        startDate: new Date('2025-04-12'),
        endDate: new Date('2025-04-13'),
        features: [
          'Pillars of Islam',
          'Prophets stories',
          'Salah practice',
          'Islamic etiquette',
          'Interactive games',
          'Certificate and gift bag'
        ],
        category: 'Workshops',
        displayOrder: 30
      },

      // Tajweed Mastery Course
      {
        name: 'Tajweed Mastery Course (8 weeks)',
        description: 'Specialized course to perfect Quran recitation with proper tajweed rules.',
        planType: PlanType.ONE_TIME,
        billingInterval: BillingInterval.ONE_TIME,
        price: 15000, // $150.00
        currency: 'usd',
        isBasePlan: false,
        isActive: true,
        maxEnrollments: 25,
        currentEnrollments: 0,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-30'),
        features: [
          '8 weekly live classes',
          'Tajweed rules breakdown',
          'Practice recordings',
          'Teacher feedback',
          'Completion certificate',
          'Lifetime material access'
        ],
        category: 'Quran Studies',
        displayOrder: 31
      },

      // Test/Trial Plan (Free)
      {
        name: 'Free Trial Week',
        description: 'Try our platform free for one week! Full access to all group classes.',
        planType: PlanType.ONE_TIME,
        billingInterval: BillingInterval.ONE_TIME,
        price: 0, // Free
        currency: 'usd',
        isBasePlan: false,
        isActive: true,
        features: [
          'Full platform access',
          'All group classes',
          'Online materials',
          'No credit card required',
          'No commitment'
        ],
        category: 'Trial',
        displayOrder: 0
      }
    ];

    console.log(`📝 Creating ${plans.length} subscription plans...`);

    for (const planData of plans) {
      const existing = await planRepository.findOne({
        where: { name: planData.name }
      });

      if (existing) {
        console.log(`⚠️  Plan "${planData.name}" already exists, skipping...`);
        continue;
      }

      const plan = planRepository.create(planData);
      await planRepository.save(plan);
      console.log(`✅ Created: ${planData.name} ($${planData.price / 100})`);
    }

    console.log('\n🎉 Seeding completed successfully!\n');
    console.log('Available plans:');
    const allPlans = await planRepository.find({ order: { displayOrder: 'ASC' } });
    allPlans.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.planType}) - $${plan.price / 100}`);
    });

    await AppDataSource.destroy();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    process.exit(1);
  }
}

// Run the seed function
seedSubscriptionPlans();
