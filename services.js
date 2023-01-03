const crypto = require('crypto');
const {UserDb, defaultTodo, TasksDb} = require('./db');

let todoDb = [...TasksDb];
let userDb = [...UserDb];

// Helpers
function signInUser(data){
    const {username, password} = data;
    let user = null;


    for (let each of userDb){
        if((each.username === username) || (each.email === username)){
            user = {...each};
            break;
        }
    }

    if(!user) return [ null, "User does not exist"];
    if (user.password !== password) return [null, "Invalid username or password"];
    
    delete user.password;
    user.token = "token_"+user._id;
    return [user, null];
}

function getUserIdFromToken(token){
    // get user from data with token
    const user = userDb.find((each)=>each.token === token);

    if (user) return user._id;
    else throw new Error("User does not exist");
}

function getAuthUserTasks(user_id){
    // Load all the user tasks from db
    // console.log(user_id);
    return todoDb.filter((each)=> each.user == user_id);
}

function createUserTask(user_id, task_data){
    const {task, platform} = task_data;

    todoDb.push({
        _id: crypto.randomUUID(),
        task,
        completed: false,
        platform,

        user:user_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

    });

    return getAuthUserTasks(user_id);
}

function updateUserTask(user_id, task){

    todoDb = todoDb.map((each)=> {
        // console.log(each);
        if (each.user != user_id) return each;
        if (each._id == task._id) return {...each, ...task, updatedAt: new Date().toISOString()};
        return each;
    });

    return getAuthUserTasks(user_id);
}

function deleteUserTask(user_id, task_id){
    todoDb = todoDb.filter((each)=> (each.user == user_id) && (each._id != task_id));

    return getAuthUserTasks(user_id);
}

function clearUserCompletedTask(user_id){
    todoDb = todoDb.filter((each)=> (each.user == user_id) && (each.completed !== true));

    return getAuthUserTasks(user_id);
}

function createNewUser(data){

    // Check if user exist
    const {username, email} = data;

    if (userDb.find((each)=> (each.email === email) || (each.username === username))) return [null, "Username/Email already exist"];
    
    const _id = new Date().getTime();
    const token = "token_"+_id;
    userDb.push({
        _id,
        token,
        ...data
    });

    defaultTodo.forEach((each)=>{
        createUserTask(_id, each);
    });

    return [data, null];
}


module.exports = {
    signInUser,
    getUserIdFromToken,
    getAuthUserTasks,
    createUserTask,
    updateUserTask,
    deleteUserTask,
    clearUserCompletedTask,
    createNewUser
}
