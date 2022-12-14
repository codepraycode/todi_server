const mongoose = require('mongoose');

const TaskSchema = mongoose.Schema({
    task:{
        type:String,
        required: true
    },
    completed:{
        type:Boolean,
        default:false,
    },
    platform:{
        type:String,
        required:true
    }
}, {timestamps: true });

module.exports = mongoose.model('Tasks', TaskSchema);