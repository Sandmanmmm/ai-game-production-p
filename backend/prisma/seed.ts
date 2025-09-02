import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const hashedPassword1 = await bcrypt.hash('password123', 12);
  const hashedPassword2 = await bcrypt.hash('password456', 12);

  const user1 = await prisma.user.create({
    data: {
      email: 'john@gameforge.com',
      password: hashedPassword1,
      name: 'John Developer',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@gameforge.com',
      password: hashedPassword2,
      name: 'Jane Designer',
    },
  });

  // Create sample projects linked to users
  const sampleProjects = await prisma.project.createMany({
    data: [
      {
        userId: user1.id,
        title: 'Epic Fantasy RPG',
        description: 'A grand adventure game set in a magical world with dragons, wizards, and ancient mysteries.',
        status: 'IN_PROGRESS',
      },
      {
        userId: user1.id,
        title: 'Space Shooter Arcade',
        description: 'Fast-paced arcade-style space shooter with power-ups and boss battles.',
        status: 'DRAFT',
      },
      {
        userId: user2.id,
        title: 'Puzzle Adventure',
        description: 'Mind-bending puzzles combined with an engaging storyline.',
        status: 'COMPLETED',
      },
    ],
  });

  console.log(`Created 2 sample users and ${sampleProjects.count} sample projects`);
  console.log('Sample users:');
  console.log('- john@gameforge.com (password: password123)');
  console.log('- jane@gameforge.com (password: password456)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
