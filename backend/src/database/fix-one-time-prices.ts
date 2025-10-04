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

async function fixOneTimePrices() {
  await AppDataSource.initialize();
  console.log('✅ Database connected');

  const planRepo = AppDataSource.getRepository('subscription_plans');

  // Get all one_time plans
  const oneTimePlans = await planRepo.find({
    where: { plan_type: 'one_time' }
  });

  console.log(`\n📋 Found ${oneTimePlans.length} one-time plans\n`);

  for (const plan of oneTimePlans) {
    console.log(`\n🔍 Checking plan: ${plan.name}`);
    console.log(`   Current Price ID: ${plan.stripe_price_id}`);

    if (plan.stripe_price_id) {
      try {
        // Check if current price is recurring
        const currentPrice = await stripe.prices.retrieve(plan.stripe_price_id);

        if (currentPrice.type === 'recurring') {
          console.log(`   ❌ This is a RECURRING price - needs to be fixed!`);

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

          console.log(`   ✅ Created new one-time price: ${newPrice.id}`);

          // Update the plan in database
          await planRepo.update(plan.id, {
            stripe_price_id: newPrice.id
          });

          console.log(`   ✅ Updated database with new price ID`);
        } else {
          console.log(`   ✅ Already a one-time price`);
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    } else {
      console.log(`   ⚠️  No Stripe price ID set`);
    }
  }

  await AppDataSource.destroy();
  console.log('\n✅ Done!');
}

fixOneTimePrices().catch(console.error);
