const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const defaultUserId = 1;

    // Check if a user with id = 1 exists
    const existingUser = await prisma.user.findUnique({
        where: { id: defaultUserId },
    });

    if (!existingUser) {
        console.log('Default user not found. Creating...');

        // Create the default user
        const newUser = await prisma.user.create({
            data: {
                // We explicitly set the ID if the database allows it, 
                // but typically auto-increment will just assign 1 if it's the first record.
                // For Postgres, it's safer to just provide the data and let it auto-increment to 1,
                // or explicitly provide the id if needed.
                id: defaultUserId,
                fullName: 'Student',
                email: 'student@example.com',
                course: 'Computer Science',
                yearOfStudy: '2nd Year',
                collegeName: 'Demo University',
            },
        });

        console.log('Default user created:', newUser);
    } else {
        console.log('Default user already exists:', existingUser);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
