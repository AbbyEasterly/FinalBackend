const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.DB, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }       
};

connectToDatabase();

const packSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Pack', packSchema);
