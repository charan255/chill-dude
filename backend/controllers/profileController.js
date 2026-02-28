const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// In a real app, this would come from auth middleware
const DEFAULT_USER_ID = 1;

const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: DEFAULT_USER_ID }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { fullName, email, course, yearOfStudy, collegeName } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: DEFAULT_USER_ID },
            data: {
                ...(fullName && { fullName }),
                ...(email && { email }),
                ...(course && { course }),
                ...(yearOfStudy && { yearOfStudy }),
                ...(collegeName && { collegeName })
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

module.exports = {
    getProfile,
    updateProfile
};
