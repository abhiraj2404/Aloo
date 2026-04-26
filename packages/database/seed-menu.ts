import { prisma } from './index';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const menuData = [
  {
    category: "SOUP",
    items: [
      { name: "Lemon Coriander Soup", price: 12000 },
      { name: "Manchow Soup", price: 12000 },
      { name: "Hot & Sour Soup", price: 12000 },
      { name: "Cream of Veg Soup", price: 12000 },
      { name: "Cream of Mushroom Soup", price: 13000 }
    ]
  },
  {
    category: "RICE",
    items: [
      { name: "Veg Fried Rice", price: 10000 },
      { name: "Gobi Fried Rice", price: 12000 },
      { name: "Paneer Fried Rice", price: 15000 },
      { name: "Schezwan Fried Rice", price: 14000 },
      { name: "Chilly Garlic Rice", price: 16000 },
      { name: "Mix Veg Rice", price: 18000 },
      { name: "Jeera Rice", price: 10000 },
      { name: "Curd Rice", price: 9000 },
      { name: "Dal Khichdi Rice", price: 13000 }
    ]
  },
  {
    category: "NOODLES",
    items: [
      { name: "Veg Noodles", price: 10000 },
      { name: "Gobi Noodles", price: 12000 },
      { name: "Paneer Noodles", price: 15000 },
      { name: "Schezwan Noodles", price: 14000 },
      { name: "Chilly Garlic Noodles", price: 16000 },
      { name: "Mix Veg Noodles", price: 18000 }
    ]
  },
  {
    category: "STARTERS",
    items: [
      { name: "Gobi 65", price: 13000 },
      { name: "Gobi Manchurian", price: 17000 },
      { name: "Chilly Gobi", price: 16000 },
      { name: "Paneer 65", price: 20000 },
      { name: "Paneer Manchurian", "price": 23000 },
      { name: "Chilly Paneer", price: 24000 },
      { name: "Mushroom 65", price: 20000 },
      { name: "Mushroom Manchurian", price: 22000 },
      { name: "Chilly Mushroom", price: 23000 },
      { name: "Honey Chilly Potato", price: 12000 },
      { name: "Chilly Potato", price: 10000 },
      { name: "French Fry", price: 7000 },
      { name: "Peri Peri Fry", price: 9000 }
    ]
  },
  {
    category: "MOMOS",
    items: [
      { name: "Steam Momos", price: 9000 },
      { name: "Fried Momos", price: 11000 },
      { name: "Kurkure Momos", price: 14000 },
      { name: "Schezwan Momos", price: 13000 },
      { name: "Chilly Momos", price: 14000 },
      { name: "Red Sauce Momos", price: 18000 }
    ]
  },
  {
    category: "PASTA",
    items: [
      { name: "White Sauce Pasta", price: 17000 },
      { name: "Red Sauce Pasta", price: 18000 }
    ]
  },
  {
    category: "CURRY",
    items: [
      { name: "Dal Tadka", price: 10000 },
      { name: "Dal Fry", price: 9000 },
      { name: "Dal Makhani", price: 11000 },
      { name: "Kadai Paneer", price: 12000 },
      { name: "Aloo Jeera", price: 9000 },
      { name: "Bhindi Masala", price: 12000 },
      { name: "Mutter Paneer", price: 12000 },
      { name: "Paneer Butter Masala", price: 11000 },
      { name: "Aloo Gobi Masala", price: 11000 },
      { name: "Kaju Paneer Masala", price: 14000 },
      { name: "Mushroom Masala", price: 12000 },
      { name: "Kadai Vegetable", price: 13000 }
    ]
  },
  {
    category: "BREAD",
    items: [
      { name: "Roti", price: 1000 },
      { name: "Butter Roti", price: 1500 }
    ]
  },
  {
    category: "PARATHA",
    items: [
      { name: "Aloo Paratha", price: 10000 },
      { name: "Paneer Paratha", price: 12000 },
      { name: "Onion Cheese Paratha", price: 15000 },
      { name: "Aloo Cheese Paratha", price: 15000 },
      { name: "Paneer Cheese Paratha", price: 17000 }
    ]
  },
  {
    category: "PIZZA",
    items: [
      { name: "Greek Pizza (Small)", price: 20000 },
      { name: "Greek Pizza (Large)", price: 25000 },
      { name: "Delhi Pizza (Small)", price: 22000 },
      { name: "Delhi Pizza (Large)", price: 28000 },
      { name: "Peri Peri Pizza (Small)", price: 20000 },
      { name: "Peri Peri Pizza (Large)", price: 25000 },
      { name: "Margherita Pizza (Small)", price: 11000 },
      { name: "Margherita Pizza (Large)", price: 15000 },
      { name: "Cheese Pepper Corn Pizza (Small)", price: 20000 },
      { name: "Cheese Pepper Corn Pizza (Large)", price: 25000 }
    ]
  }
];

async function seed() {
  rl.question('Please enter the shopId to seed the menu for: ', async (shopId) => {
    if (!shopId) {
      console.error('Invalid shopId provided');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    try {
      console.log(`Checking if Shop ${shopId} exists...`);
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) {
        console.error(`Shop with ID ${shopId} does not exist!`);
        rl.close();
        await prisma.$disconnect();
        return;
      }

      console.log(`Checking for existing menu...`);
      let menu = await prisma.menu.findUnique({ where: { shopId } });
      if (!menu) {
        console.log(`Creating new menu for shop ${shopId}...`);
        menu = await prisma.menu.create({ data: { shopId } });
      }

      console.log('Seeding categories and items...');

      for (let i = 0; i < menuData.length; i++) {
        const catData = menuData[i]!;
        
        let category = await prisma.category.findUnique({
             where: { name: catData.category }
        });
        
        if(!category) {
             category = await prisma.category.create({
                 data: {
                     name: catData.category,
                     orderIndex: i + 1,
                     menuId: menu.id,
                 }
             });
             console.log(`Created category: ${category.name}`);
        } else {
             console.log(`Category exists: ${category.name} - Adding items..`);
        }

        for (const itemData of catData.items) {
          const existingItem = await prisma.item.findFirst({
            where: { shopId: shopId, name: itemData.name }
          });

          if (!existingItem) {
            await prisma.item.create({
              data: {
                shopId: shopId,
                categoryId: category.id,
                name: itemData.name,
                price: itemData.price!,
                isVeg: true,
                isAvailable: true
              }
            });
            console.log(`  Added: ${itemData.name} - ₹${itemData.price! / 100}`);
          } else {
            console.log(`  Skipped (already exists): ${itemData.name}`);
          }
        }
      }

      console.log('✅ Menu seeded successfully!');
    } catch (e) {
      console.error('❌ Error while seeding menu:', e);
    } finally {
      rl.close();
      await prisma.$disconnect();
    }
  });
}

seed();
