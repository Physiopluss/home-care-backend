const mongoose = require('mongoose');


const advertisementSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true
    },
}, { timestamps: true });

module.exports = mongoose.model('Advertisement', advertisementSchema);