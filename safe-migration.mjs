// Safer database migration script
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function safeMigration() {
  try {
    console.log('🚀 Running safe database migration...');
    
    // 1. Create reward_categories table
    console.log('📋 Creating reward_categories table...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE reward_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          icon VARCHAR(50),
          color VARCHAR(20) DEFAULT 'blue',
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ reward_categories table created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ reward_categories table already exists');
      } else {
        console.error('❌ Error creating reward_categories:', error.message);
      }
    }
    
    // 2. Add columns to rewards table
    console.log('📋 Adding columns to rewards table...');
    const rewardsColumns = [
      { name: 'category_id', type: 'INTEGER REFERENCES reward_categories(id)' },
      { name: 'required_privilege', type: 'VARCHAR(50)' },
      { name: 'privilege_description', type: 'TEXT' },
      { name: 'is_exclusive', type: 'BOOLEAN DEFAULT false' }
    ];
    
    for (const col of rewardsColumns) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE rewards ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Added ${col.name} to rewards table`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Column ${col.name} already exists in rewards table`);
        } else {
          console.error(`❌ Error adding ${col.name}:`, error.message);
        }
      }
    }
    
    // 3. Add columns to reward_redemptions table
    console.log('📋 Adding columns to reward_redemptions table...');
    const redemptionColumns = [
      { name: 'shipping_tracking', type: 'VARCHAR(100)' },
      { name: 'shipping_notes', type: 'TEXT' },
      { name: 'shipping_method', type: 'VARCHAR(50) DEFAULT \'separate\'' },
      { name: 'shipped_at', type: 'TIMESTAMP' },
      { name: 'delivered_at', type: 'TIMESTAMP' },
      { name: 'shipping_cost', type: 'INTEGER DEFAULT 0' }
    ];
    
    for (const col of redemptionColumns) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE reward_redemptions ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Added ${col.name} to reward_redemptions table`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Column ${col.name} already exists in reward_redemptions table`);
        } else {
          console.error(`❌ Error adding ${col.name}:`, error.message);
        }
      }
    }
    
    // 4. Create indexes
    console.log('📋 Creating indexes...');
    const indexes = [
      { name: 'idx_rewards_category', table: 'rewards', column: 'category_id' },
      { name: 'idx_rewards_privilege', table: 'rewards', column: 'required_privilege' }
    ];
    
    for (const idx of indexes) {
      try {
        await prisma.$executeRawUnsafe(`CREATE INDEX ${idx.name} ON ${idx.table}(${idx.column})`);
        console.log(`✅ Created index ${idx.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Index ${idx.name} already exists`);
        } else {
          console.error(`❌ Error creating ${idx.name}:`, error.message);
        }
      }
    }
    
    // 5. Insert default categories
    console.log('📋 Inserting default categories...');
    const categories = [
      { name: 'Elektronik', description: 'Gadget dan perangkat elektronik', icon: 'DevicePhoneMobileIcon', color: 'blue', sort_order: 1 },
      { name: 'Fashion', description: 'Pakaian dan aksesoris', icon: 'ShoppingBagIcon', color: 'purple', sort_order: 2 },
      { name: 'Makanan & Minuman', description: 'Snack, minuman, dan makanan', icon: 'CakeIcon', color: 'yellow', sort_order: 3 },
      { name: 'Digital', description: 'Voucher dan layanan digital', icon: 'GlobeAltIcon', color: 'green', sort_order: 4 },
      { name: 'Eksklusif Plus', description: 'Hadiah khusus member Berkomunitas Plus', icon: 'StarIcon', color: 'amber', sort_order: 5 },
      { name: 'Koleksi', description: 'Merchandise dan barang koleksi', icon: 'GiftIcon', color: 'pink', sort_order: 6 }
    ];
    
    for (const cat of categories) {
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO reward_categories (name, description, icon, color, sort_order)
          VALUES ('${cat.name}', '${cat.description}', '${cat.icon}', '${cat.color}', ${cat.sort_order})
          ON CONFLICT DO NOTHING
        `);
        console.log(`✅ Inserted category: ${cat.name}`);
      } catch (error) {
        console.log(`⚠️ Category ${cat.name} might already exist:`, error.message);
      }
    }
    
    // 6. Set default category for existing rewards
    console.log('📋 Setting default category for existing rewards...');
    try {
      const result = await prisma.$executeRawUnsafe(`
        UPDATE rewards SET category_id = 1 WHERE category_id IS NULL
      `);
      console.log('✅ Set default category for existing rewards');
    } catch (error) {
      console.error('❌ Error setting default category:', error.message);
    }
    
    // 7. Verify migration
    console.log('\n🔍 Verifying migration...');
    
    const categoriesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM reward_categories`;
    console.log(`✅ reward_categories: ${categoriesCount[0].count} records`);
    
    const rewardsWithCategory = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM rewards WHERE category_id IS NOT NULL
    `;
    console.log(`✅ rewards with category: ${rewardsWithCategory[0].count} records`);
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

safeMigration();