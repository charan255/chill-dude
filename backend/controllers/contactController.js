const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_USER_ID = 1;

const getContacts = async (req, res) => {
    try {
        const contacts = await prisma.trustedContact.findMany({
            where: { userId: DEFAULT_USER_ID }
        });
        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
};

const createContact = async (req, res) => {
    try {
        const { name, phone, relationType } = req.body;

        if (!name || !phone || !relationType) {
            return res.status(400).json({ error: 'Name, phone, and relationType are required' });
        }

        const newContact = await prisma.trustedContact.create({
            data: {
                name,
                phone,
                relationType,
                userId: DEFAULT_USER_ID
            }
        });

        res.status(201).json(newContact);
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({ error: 'Failed to create contact' });
    }
};

const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.trustedContact.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
};

module.exports = {
    getContacts,
    createContact,
    deleteContact
};
