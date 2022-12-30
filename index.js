require("dotenv").config();
const crypto = require('crypto');
const {UserDb, defaultTodo, TasksDb} = require('./db');

const origins = [
    'http://127.0.0.1:5173', 
    process.env.webClientUrl,
    process.env.mobileClientUrl,
]

const io = require('socket.io')(3000, {
    cors:{
        origin: origins
    }
})

console.log(origins)
/*
    Events
    1) create_account: username, email, password
    2) signin_account: email/username, password
    3) create_task: task, platform, // completed is default to false
    4) update_task: task, platform, completed
    5) delete_task: _id
    6) subscribe: // join room and load task of authenticated user
    7) tasks_update: // Send updated tasks, an array means new, and object mean update
    8) remove_task: // sends tasks_id to remove across all platforms
    9) clear_completed_task: // clears user completed tasks
*/
const EVENTS = {
    connection:'connection',

    // Custom events
    create_account:'create_account',
    signin_account:'signin_account',
    create_task:'create_task',
    update_task:'update_task',
    delete_task:'delete_task',
    subscribe:'subscribe',

    // Outward event
    tasks_update:"tasks_update",
    remove_task:"remove_task",
    clear_completed_task:"clear_completed_task",
}

let todoDb = [...TasksDb];
let userDb = [...UserDb];

// Auth namespace
// namespace for just auth feature, should close when authenticated
const authIo = io.of('/auth');
// Auth is made and a token is sent back to the client
// then the token is used in other socket connection, and /auth is closed
authIo.on(EVENTS.connection, socket=>{
    // Auth connection is initialized

    socket.on(EVENTS.create_account, (data, cb)=>{
        // Create user account with token
        let [user, error] = createNewUser(data);
        // send token back to client
        cb({
            socketId:socket.id,
            error,
            data: user
        });
    });

    socket.on(EVENTS.signin_account, (data, cb)=>{
        // Verify that data exists
        // if user exist, return a payload with token
        // otherwise return a payload with error instead of token
        // console.log(data);
        // let user = null, error = null;

        let [user, error] = signInUser(data);
        
        // console.log(user, error);

        // send payload back to client
        cb({
            // Sample payload
            // data is null if there is error, while error carries a payload
            socketId: socket.id,
            error,// a payload if there is error
            data: user,
        });
    });

    // Socket is expected to close as soon as token is obtained

});


// Using tasks namespace
const taskIo = io.of('/task');

// Setup auth middleware
taskIo.use((socket, next)=>{
    // User_id will be used as token    
    const {token} = socket.handshake?.auth || {};

    if(Boolean(token)){ // if there is an auth token in connection

        try {
            socket.userId = getUserIdFromToken(token);
            socket.userToken = token;
            next();
        }catch (err){
            // send an connection error message
            next(new Error("Invalid auth token"));
        }
        
    }else{
        // send an connection error message
        next(new Error("Authentication is required!"));
    }

});

taskIo.on('connection', socket=>{
    console.log("Connected:", socket.id);

    // on Subscribe, join room, and return all the user's tasks
    socket.on(EVENTS.subscribe, (cb)=>{
        const user_id = socket.userId;
        const user_token = socket.userToken;

        socket.join(user_token);

        // Get all the tasks of the user
        const user_tasks = getAuthUserTasks(user_id);

        const payload = {
            socketId: socket.id,
            error:null,
            data:user_tasks
        }

        // Return the payload with all user's task
        cb(payload);
    });
    // Create task
    socket.on(EVENTS.create_task, (task, cb)=>{
        const user_id = socket.userId;

        // Create task for user
        const userTasks = createUserTask(user_id, task);

        const payload = {
            socketId: socket.id,
            error:null,
            data:userTasks
        }

        // Return the payload with user's new task
        // socket.to(user_id).emit(EVENTS.tasks_update, payload);
        cb(payload);
    });
    // Update task
    socket.on(EVENTS.update_task, (task, cb)=>{
        const user_id = socket.userId;

        // Update user task
        const userTasks = updateUserTask(user_id, task);

        const payload = {
            socketId: socket.id,
            error:null,
            data:userTasks
        }

        // Return the payload with user's new task
        // socket.to(user_token).emit(EVENTS.tasks_update, payload);
        cb(payload);
    });
    // Delete task
    socket.on(EVENTS.delete_task, (task_id, cb)=>{
        const user_id = socket.userId;

        // Delete user task
        const userTasks = deleteUserTask(user_id, task_id);

        const payload = {
            socketId: socket.id,
            error:null,
            data:userTasks
        }

        // Return the payload with user's new task
        // socket.to(user_id).emit(EVENTS.remove_task, payload);
        cb(payload);
    });    
    // Clear completed task
    socket.on(EVENTS.clear_completed_task, (cb)=>{
        const user_id = socket.userId;        

        // Delete user task
        const userTasks = clearUserCompletedTask(user_id);

        const payload = {
            socketId: socket.id,
            error:null,
            data:userTasks
        }

        // Return the payload with user's new task
        // socket.to(user_id).emit(EVENTS.remove_task, payload);
        cb(payload);
    });    
})


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
    else return new Error("User does not exist");
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