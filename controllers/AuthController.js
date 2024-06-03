const jwt = require("jsonwebtoken");
require ("dotenv").config();
const users = require ("../db/users.json");

const login = (req, res) => {
    const {username, password} = req.body;
    const user = users.find(user => user.username === username && user.password ===  password);

    if(!user){
        return res.status(404).send({error: "Username o password errati"});
    }
    const token = jwt.sign(user, process.env.JWT_SECRET);
    res.status(200).send({token});
};

const generateToken = (user) => {
    const payload = user;
    const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1h"});

    return token;
};

const authenticateJWT = (req, res, next) => {
    // verifico se il token è presente nella richiesta
    const {authorizationHeader} = req.headers;
    if(!authorizationHeader) {
        return res.status(401).send({error: "Non autorizzato"});
    }

    //altrimenti raccolgo il token e decodifico il token
    const token = authorizationHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if(err) {
            // se il token non è valido restituisco un errore
            return res.status(403).send(err);
        }
        req.user = user;
        // se il token è valido passo al prossimo middleware
        next();
    });
};

const isAdmin = (req, res, next) => {
    const {username, password} = req.user;
    const user = users.find(user => user.username === username && user.password ===  password);

    if(!user || !user.isAdmin) {
        return res.status(401).send({error: "Non autorizzato, devi essere admin"});
    }

    next();
};

module.exports = {
    login,
    generateToken,
    authenticateJWT,
    isAdmin
};