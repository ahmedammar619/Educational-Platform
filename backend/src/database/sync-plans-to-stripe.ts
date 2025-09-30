import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SubscriptionPlansService } from '../modules/payments/subscription-plans.service';
import { AppDataSource } from '../data-source';
import { SubscriptionPlan } from '../modules/payments/entities/subscription-plan.entity';

async function syncPlansToStripe() {
  console.log('🔄 Syncing existing plans to Stripe...\n');

  try {
    // Initialize NestJS app to get access to services
    const app = await NestFactory.createApplicationContext(AppModule);
    const subscriptionService = app.get(SubscriptionPlansService);

    // Get repository
    await AppDataSource.initialize();
    const planRepository = AppDataSource.getRepository(SubscriptionPlan);

    // Find all plans without Stripe IDs
    const plansWithoutStripe = await planRepository.find({
      where: [
        { stripeProductId: null },
        { stripePriceId: null }
      ]
    });

    console.log(`Found ${plansWithoutStripe.length} plans without Stripe IDs\n`);

    if (plansWithoutStripe.length === 0) {
      console.log('✅ All plans already synced to Stripe!');
      await app.close();
      await AppDataSource.destroy();
      return;
    }

    for (const plan of plansWithoutStripe) {
      try {
        console.log(`📝 Syncing: ${plan.name}...`);

        // Create Stripe product
        const stripe = (subscriptionService as any)['stripeService']['stripe'];

        const stripeProduct = await stripe.products.create({
          name: plan.name,
          description: plan.description || '',
          metadata: {
            plan_id: plan.id,
            plan_type: plan.planType,
            category: plan.category || ''
          }
        });

        console.log(`   ✓ Created Stripe Product: ${stripeProduct.id}`);

        // Create Stripe price
        const priceConfig: any = {
          product: stripeProduct.id,
          currency: plan.currency || 'usd',
          unit_amount: plan.price,
          metadata: {
            plan_id: plan.id
          }
        };

        // Add recurring config if not one-time
        if (plan.billingInterval !== 'one_time') {
          priceConfig.recurring = {
            interval: plan.billingInterval
          };
        }

        const stripePrice = await stripe.prices.create(priceConfig);

        console.log(`   ✓ Created Stripe Price: ${stripePrice.id}`);

        // Update plan with Stripe IDs
        plan.stripeProductId = stripeProduct.id;
        plan.stripePriceId = stripePrice.id;
        await planRepository.save(plan);

        console.log(`   ✅ Synced: ${plan.name}\n`);

      } catch (error) {
        console.error(`   ❌ Error syncing ${plan.name}:`, error.message);
      }
    }

    console.log('\n🎉 Sync completed!');

    // Show final status
    const allPlans = await planRepository.find();
    const syncedCount = allPlans.filter(p => p.stripeProductId && p.stripePriceId).length;
    console.log(`\n📊 Status: ${syncedCount}/${allPlans.length} plans synced to Stripe`);

    await app.close();
    await AppDataSource.destroy();
    console.log('\n✅ Done');

  } catch (error) {
    console.error('❌ Error syncing plans:', error);
    process.exit(1);
  }
}

// Run the sync
syncPlansToStripe();
