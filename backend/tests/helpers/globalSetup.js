// Runs once before all test suites — initialises DB tables (idempotent)
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

module.exports = async () => {
    const db = require('../../database');
    await db.initialize();
};
