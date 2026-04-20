const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Récupérer le token du header Authorization
    // Format attendu: "Bearer <token>"
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
    }

    const token = authHeader.split(' ')[1]; // On récupère la partie après "Bearer"

    if (!token) {
        return res.status(401).json({ error: "Format du token invalide." });
    }

    try {
        // 2. Vérifier le token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Ajouter les infos de l'utilisateur à la requête (req)
        // Comme ça, les contrôleurs suivants pourront utiliser req.user.id
        req.user = verified;
        
        next(); // On passe au middleware/contrôleur suivant
    } catch (err) {
        res.status(401).json({ error: "Token invalide ou expiré." });
    }
};
