const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJWT = require('./auth_jwt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./Users');
const Pack = require('./pack');
const Card = require('./card');

require('dotenv').config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

const router = express.Router();

router.post('/register', async (req, res) => {
    if (!req.body.username || !req.body.password || !req.body.email) {
        return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    try {
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Register error:', err);
        if (err && err.code === 11000) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        const message = err && err.message ? err.message : 'Internal server error';
        res.status(500).json({ error: message });
    }   
});

router.post('/login', async (req, res) => {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }   
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const payload = { id: user._id, username: user.username };
        const token = jwt.sign(payload, authJWT.secret, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token: token });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }   
});

router.route('/packs')
    .get(authJWT.isAuthernicated, async (req, res) => {
        try {
            const packs = await Pack.find({ userId: req.user._id });
            res.json(packs);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    })
    .post(authJWT.isAuthernicated, async (req, res) => {
        if (!req.body.name) {
            return res.status(400).json({ error: 'Pack name is required' });
        }
        try {
            const pack = new Pack({
                name: req.body.name,    
                description: req.body.description,
                userId: req.user._id,
                score: 0
            });
            await pack.save();
            res.status(201).json({ message: 'Pack created successfully', pack: pack });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }   
    })
    .delete(authJWT.isAuthernicated, async (req, res) => {
        if (!req.body.packId) {
            return res.status(400).json({ error: 'Pack ID is required' });
        }   
        try {
            const pack = await Pack.findOneAndDelete({ _id: req.body.packId, userId: req.user._id });
            if (!pack) {
                return res.status(404).json({ error: 'Pack not found' });
            }   
            await Card.deleteMany({ PackId: pack._id });
            res.json({ message: 'Pack and associated cards deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }  
    })
    .put(authJWT.isAuthernicated, async (req, res) => {
        if (!req.body.packId) {
            return res.status(400).json({ error: 'Pack ID is required' });
        }
        try {
            const pack = await Pack.findOne({ _id: req.body.packId, userId: req.user._id });
            if (!pack) {
                return res.status(404).json({ error: 'Pack not found' });
            }
            if (req.body.name) pack.name = req.body.name;
            if (req.body.description) pack.description = req.body.description;
            if (typeof req.body.score === 'number') pack.score = req.body.score;
            await pack.save();
            res.json({ message: 'Pack updated successfully', pack: pack });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }   
    })    
    ;

router.route('/cards')
    .get(authJWT.isAuthernicated, async (req, res) => {
        if (!req.query.packId) {
            return res.status(400).json({ error: 'Pack ID is required' });
        }   
        try {
            const pack = await Pack.findOne({ _id: req.query.packId, userId: req.user._id });
            if (!pack) {
                return res.status(404).json({ error: 'Pack not found' });
            }   
            const cards = await Card.find({ PackId: req.query.packId });
            res.json(cards);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    })
    
    .post(authJWT.isAuthernicated, async (req, res) => {
        if (!req.body.front || !req.body.back || !req.body.PackId) {
            return res.status(400).json({ error: 'Front, back, and Pack ID are required' });
        }
        try {
            const pack = await Pack.findOne({ _id: req.body.PackId, userId: req.user._id });
            if (!pack) {
                return res.status(404).json({ error: 'Pack not found' });
            }           
            const card = new Card({
                front: req.body.front,
                back: req.body.back,
                PackId: req.body.PackId
            });
            await card.save();
            res.status(201).json({ message: 'Card created successfully', card: card });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }   
    })
    .delete(authJWT.isAuthernicated, async (req, res) => {
        if (!req.body.cardId) {
            return res.status(400).json({ error: 'Card ID is required' });
        }   
        try {
           const deletedCard = await Card.findOneAndDelete({ _id: req.body.cardId });
           if (!deletedCard) {
                return res.status(404).json({ error: 'Card not found' });
            }
            res.json({ message: 'Card deleted successfully' });
            
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

app.use('/api', router);

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;