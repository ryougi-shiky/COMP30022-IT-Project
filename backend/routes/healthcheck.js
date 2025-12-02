const router = require('express').Router();
const mongoose = require('mongoose');

router.get('/backend', async (req, res) => {
    try {
        res.status(200).json({ message: "Health Check Pass! The frontend is connected to backend!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch this notification" });
    }
})

/**
 * Database readiness check - verifies MongoDB is connected and ready for write operations.
 * This is used by CI/CD pipelines to ensure the database is fully initialized before running tests.
 */
router.get('/db-ready', async (req, res) => {
    try {
        // Check if mongoose is connected
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ 
                ready: false, 
                message: "Database not connected",
                state: mongoose.connection.readyState 
            });
        }

        // Perform a simple write/read/delete test to verify database is fully operational
        // Use ObjectId for guaranteed uniqueness even with concurrent requests
        const testCollection = mongoose.connection.db.collection('healthcheck_test');
        const testId = new mongoose.Types.ObjectId();
        const testDoc = { _id: testId, timestamp: new Date() };
        
        await testCollection.insertOne(testDoc);
        const found = await testCollection.findOne({ _id: testId });
        await testCollection.deleteOne({ _id: testId });

        if (found) {
            res.status(200).json({ 
                ready: true, 
                message: "Database is ready for write operations" 
            });
        } else {
            res.status(503).json({ 
                ready: false, 
                message: "Database write verification failed" 
            });
        }
    } catch (err) {
        console.error('Database readiness check failed:', err);
        res.status(503).json({ 
            ready: false, 
            message: "Database readiness check failed",
            error: err.message 
        });
    }
})

module.exports = router;
