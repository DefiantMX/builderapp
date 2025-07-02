const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create a test user with email "test@example.com" and password "password123"
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      password: hashedPassword
    },
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword
    }
  });
  
  console.log('User created/updated:', user);
}

main()
  .catch(e => {
    console.error('Error creating user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 