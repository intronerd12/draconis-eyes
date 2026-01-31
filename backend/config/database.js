const mongoose = require('mongoose');

const connectDatabase = () => {
    mongoose.connect(process.env.MONGO_URI)
        .then(con => {
            console.log(`MongoDB connected with HOST: ${con.connection.host}`);
        })
        .catch(err => {
            console.error('MongoDB connection error:', err);
            process.exit(1);
        });
}

module.exports = connectDatabase;