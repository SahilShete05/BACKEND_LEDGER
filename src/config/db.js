const mongoose = require("mongoose");

async function connectDB() {
    
        mongoose.connect(process.env.MONGO_URI)
        .then( () => {
            console.log("Connected to DB");
        })
        .catch( err => {
            console.log("Erro while connecting to DB", err)
            process.exit(1);
        })

    
}

module.exports = connectDB;