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

async function migrateAddOnPlans() {
  await AppDataSource.initialize();
  console.log('✅ Database connected\n');

  const planRepo = AppDataSource.getRepository('subscription_plans');

  // Get all plans with planType 'add_on'
  const addOnPlans = await planRepo
    .createQueryBuilder('plan')
    .where("plan.plan_type = 'add_on'")
    .getMany();

  console.log(`📋 Found ${addOnPlans.length} add_on plans to migrate\n`);

  if (addOnPlans.length === 0) {
    console.log('✅ No add_on plans found. Migration not needed.');
    await AppDataSource.destroy();
    return;
  }

  for (const plan of addOnPlans) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Plan: ${plan.name}`);
    console.log(`  Current Plan Type: ${plan.plan_type}`);
    console.log(`  Current Billing Interval: ${plan.billing_interval}`);
    console.log(`  Stripe Price ID: ${plan.stripe_price_id}`);

    const updates: any = {
      plan_type: 'one_time'
    };

    // If billing interval is not one_time, change it
    if (plan.billing_interval !== 'one_time') {
      console.log(`  ⚠️  Billing interval is '${plan.billing_interval}', changing to 'one_time'`);
      updates.billing_interval = 'one_time';
    }

    // Check if Stripe price exists and is correct type
    if (plan.stripe_price_id) {
      try {
        const currentPrice = await stripe.prices.retrieve(plan.stripe_price_id);

        if (currentPrice.type === 'recurring') {
          console.log(`  ❌ Stripe price is RECURRING, creating new one-time price`);

          // Get the product
          const productId = typeof currentPrice.product === 'string'
            ? currentPrice.product
            : currentPrice.product.id;

          // Create a new ONE-TIME price
          const newPrice = await stripe.prices.create({
            product: productId,
            unit_amount: plan.price,
            currency: plan.currency || 'usd',
            metadata: {
              planId: plan.id,
              planName: plan.name,
              type: 'one_time'
            }
          });

          console.log(`  ✅ Created new one-time Stripe price: ${newPrice.id}`);
          updates.stripe_price_id = newPrice.id;
        } else {
          console.log(`  ✅ Stripe price is already one-time`);
        }
      } catch (error) {
        console.error(`  ❌ Error checking Stripe price: ${error.message}`);
      }
    } else {
      console.log(`  ⚠️  No Stripe price ID set`);
    }

    // Update the plan in database
    try {
      await planRepo.update(plan.id, updates);
      console.log(`  ✅ Updated plan to:`);
      console.log(`     - Plan Type: ${updates.plan_type}`);
      if (updates.billing_interval) {
        console.log(`     - Billing Interval: ${updates.billing_interval}`);
      }
      if (updates.stripe_price_id) {
        console.log(`     - Stripe Price ID: ${updates.stripe_price_id}`);
      }
    } catch (error) {
      console.error(`  ❌ Error updating plan: ${error.message}`);
    }
  }

  await AppDataSource.destroy();
  console.log('\n\n✅ Migration completed successfully!');
}

migrateAddOnPlans().catch(console.error);
