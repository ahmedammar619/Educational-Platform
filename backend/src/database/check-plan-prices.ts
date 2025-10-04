import { DataSource } from 'typeorm';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'educational_platform',
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function checkPlanPrices() {
  await AppDataSource.initialize();
  console.log('✅ Database connected\n');

  const planRepo = AppDataSource.getRepository('subscription_plans');

  // Get plans with planType one_time
  const plans = await planRepo
    .createQueryBuilder('plan')
    .where("plan.plan_type = 'one_time'")
    .getMany();

  console.log(`📋 Found ${plans.length} one-time plans\n`);

  for (const plan of plans) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Plan: ${plan.name}`);
    console.log(`  - Database Plan Type: ${plan.plan_type}`);
    console.log(`  - Database Billing Interval: ${plan.billing_interval}`);
    console.log(`  - Stripe Price ID: ${plan.stripe_price_id}`);

    if (plan.stripe_price_id) {
      try {
        const price = await stripe.prices.retrieve(plan.stripe_price_id);
        console.log(`  - Stripe Price Type: ${price.type}`);

        if (price.type === 'recurring') {
          const priceAny = price as any;
          console.log(`  - Stripe Recurring Interval: ${priceAny.recurring?.interval}`);
          console.log(`  ❌ PROBLEM: This is a RECURRING price but plan is one-time!`);
        } else {
          console.log(`  ✅ Correct: Stripe price is one-time`);
        }
      } catch (error) {
        console.log(`  ❌ Error fetching price: ${error.message}`);
      }
    } else {
      console.log(`  ⚠️  No Stripe price ID`);
    }
  }

  await AppDataSource.destroy();
  console.log('\n\n✅ Done!');
}

checkPlanPrices().catch(console.error);
