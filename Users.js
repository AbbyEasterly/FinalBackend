const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt'); // Use bcrypt, not bcrypt-nodejs
let mongoServer;

const connectToDatabase = async () => {
    const dbUri = process.env.DB;
    if (dbUri) {
        try {
            await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 });
            console.log('Connected to MongoDB');
            return;
        } catch (err) {
            console.error('Error connecting to MongoDB:', err);
        }
    }
    try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to in-memory MongoDB');
    } catch (err) {
        console.error('Error connecting to in-memory MongoDB:', err);
        process.exit(1);
    }
};

connectToDatabase();

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true }
});

userSchema.pre('save', async function () {
    const user = this;
    if (!user.isModified('password')) return;
    try {
        const hash = await bcrypt.hash(user.password, 10);
        user.password = hash;
    } catch (err) {
        throw err;
    }
});

userSchema.methods.comparePassword = async function (password) {
    try {
    return await bcrypt.compare(password, this.password);
    } catch (err) {
        throw err;
    }
};


module.exports  = mongoose.model('User', userSchema);