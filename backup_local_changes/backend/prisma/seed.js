"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const sampleProjects = await prisma.project.createMany({
        data: [
            {
                userId: 'user-1',
                title: 'Epic Fantasy RPG',
                description: 'A grand adventure game set in a magical world with dragons, wizards, and ancient mysteries.',
                status: 'IN_PROGRESS',
            },
            {
                userId: 'user-1',
                title: 'Space Shooter Arcade',
                description: 'Fast-paced arcade-style space shooter with power-ups and boss battles.',
                status: 'DRAFT',
            },
            {
                userId: 'user-2',
                title: 'Puzzle Adventure',
                description: 'Mind-bending puzzles combined with an engaging storyline.',
                status: 'COMPLETED',
            },
        ],
    });
    console.log(`Created ${sampleProjects.count} sample projects`);
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
//# sourceMappingURL=seed.js.map