require("dotenv").config();

const express = require("express");
const { createServer } = require("http");
const {    
    getUserIdFromToken,
    getAuthUserTasks,
    createUserTask,
    updateUserTask,
    deleteUserTask,
    clearUserCompletedTask,
    signInUser,
    createNewUser
} = require('./services');

const app = express();
const httpServer = createServer(app);

const io = require('socket.io')(httpServer)
const PORT = 3000;

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

    // Incoming events
    create_account:'account:create',
    signin_account:'account:signin',
    create_task:'task:create',
    update_task:'task:update',
    delete_task:'task:delete',
    subscribe:'task:subscribe',
    subscribe:'task:unsubscribe',
    clear_completed_task:"task:clear-completed",

    // Outgoing event
    incoming_tasks:"incoming:tasks",
}

// io.on('connection', onConnection);


httpServer.listen(PORT, ()=>{
    console.log("Listening on port", PORT)
});


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

    const {token} = socket.handshake.query;

    if(Boolean(token)){ // if there is an auth token in connection

        try {
            socket.userId = getUserIdFromToken(token);
            socket.userToken = token;
            // console.log(socket.userId, socket.userToken)
            next();
        }catch (err){
            // send an connection error message
            const error = new Error("auth_error");
            // error.code = "auth_error";
            next(error);
        }
        
    }else{
        // send an connection error message
        const error = new Error("auth_required");
        // error.code = "auth_required";
        next(error);
    }

});

function broadCastTasks (socket, user_tasks){
    const user_token = socket.userToken;
    socket.emit(EVENTS.incoming_tasks, user_tasks);
    // console.log("Broadcasted to:", user_token);
};

taskIo.on('connection', socket=>{
    console.log("Connected:", socket.id);

    // on Subscribe, join room, and return all the user's tasks
    socket.on(EVENTS.subscribe, ()=>{
        const user_id = socket.userId;
        const user_token = socket.userToken;

        socket.join(user_token);

        // Get all the tasks of the user
        const user_tasks = getAuthUserTasks(user_id);

        broadCastTasks(socket, user_tasks);
    });

    // Create task
    socket.on(EVENTS.create_task, (task, platform)=>{
        const user_id = socket.userId;

        // Create task for user
        // task is a string, so as platform
        const userTasks = createUserTask(user_id, {task, platform});

        broadCastTasks(socket, userTasks);
    });

    // Update task
    socket.on(EVENTS.update_task, (task, platform)=>{
        const user_id = socket.userId;

        // Update user task
        // task is an object
        const userTasks = updateUserTask(user_id, {...task, platform});

        broadCastTasks(socket, userTasks);
    });

    // Delete task
    socket.on(EVENTS.delete_task, (task_id)=>{
        const user_id = socket.userId;

        // Delete user task
        const userTasks = deleteUserTask(user_id, task_id);

        broadCastTasks(socket, userTasks);
    });

    // Clear completed task
    socket.on(EVENTS.clear_completed_task, ()=>{
        const user_id = socket.userId;        

        // Delete user task
        const userTasks = clearUserCompletedTask(user_id);

        broadCastTasks(socket, userTasks);
    }); 
});


