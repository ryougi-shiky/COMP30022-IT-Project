const { verifyAccessToken } = require('../utils/jwtUtils');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ 
      message: "Access token required" 
    });
  }

  // More robust token extraction: validate Bearer scheme and extract token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ 
      message: "Access token required" 
    });
  }

  const token = parts[1];
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(403).json({ 
      message: "Invalid or expired token" 
    });
  }

  req.user = decoded;
  next();
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader) {
    // More robust token extraction: validate Bearer scheme and extract token
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
