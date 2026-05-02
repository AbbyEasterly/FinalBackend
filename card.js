const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const connectToDatabase = async () => {
try {    await mongoose.connect(process.env.DB, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');
} catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
}   
};

connectToDatabase();

const cardSchema = new mongoose.Schema({
    front: { type: String, required: true },
    back: { type: String, required: true },
    PackId: { type: Schema.Types.ObjectId, ref: 'Pack', required: true }
});

module.exports = mongoose.model('Card', cardSchema);
