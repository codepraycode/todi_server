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

const UserSchema = mongoose.Schema({
    username:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required: true
    },
    password:{
        type:String,
        required:true
    }
}, {timestamps: true });

const TaskModel = mongoose.model('Task', TaskSchema);
const UserModel = mongoose.model('User', UserSchema);


module.exports = {
    TaskModel,
    UserModel,
}