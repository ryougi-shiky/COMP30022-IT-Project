const router = require('express').Router();

router.get('/backend', async (req, res) => {
    try {
        res.status(200).json({ message: "Health Check Pass! The frontend is connected to backend!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch this notification" });
    }
})

module.exports = router;
