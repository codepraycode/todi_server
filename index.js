const io = require('socket.io')(3000)
// , {
//     cors:{
//         origin: []
//     }
// })

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
}

// Auth namespace
// namespace for just auth feature, should close when authenticated
const authIo = io.of('/auth');
// Auth is made and a token is sent back to the client
// then the token is used in other socket connection, and /auth is closed
authIo.on(EVENTS.connection, socket=>{
    // Auth connection is initialized

    socket.on(EVENTS.create_account, (data, cb)=>{
        // Create user account with token
        console.log(data);

        // send token back to client
        cb('sample_token');
    });

    socket.on(EVENTS.signin_account, (data, cb)=>{
        // Verify that data exists
        // if user exist, return a payload with token
        // otherwise return a payload with error instead of token
        console.log(data);

        // send payload back to client
        cb({
            // Sample payload
            // data is null if there is error, while error carries a payload
            socketId: socket.id,
            error:null, // a payload if there is error
            data:{
                message: 'All is well',
                ...data
            }
        });
    });

    // Socket is expected to close as soon as token is obtained

});


// Using tasks namespace
const taskIo = io.of('/task');

// Setup auth middleware
taskIo.use((socket, next)=>{
    // User_id will be used as token
    const {user_id:token} = socket.handshake?.auth || {};

    if(Boolean(token)){ // if there is an auth token in connection

        try {
            socket.userId = getUserIdFromToken(token);
            next();
        }catch (err){
            // send an connection error payload
            // data is null
            const payload = {
                
                socketId: socket.id,
                error:{
                    message: "Invalid auth token"
                },
                data:null
            }

            next(new Error(payload));
        }
        
    }else{
        // send an connection error payload
        // data is null
        const payload = {
            
            socketId: socket.id,
            error:{
                message: "Authentication is required!",
            },
            data:null
        }

        next(new Error(payload));
    }

});

taskIo.on('connection', socket=>{
    console.log("Connected:", socket.id);

    // on Subscribe, join room, and return all the user's tasks
    socket.on(EVENTS.subscribe, (cb)=>{
        const user_id = socket.userId;
        socket.join(user_id);

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
        const created_task = createUserTask(user_id, task);

        const payload = {
            socketId: socket.id,
            error:null,
            data:[created_task]
        }

        // Return the payload with user's new task
        socket.to(user_id).emit(EVENTS.tasks_update, payload);
        cb(payload);
    });
    // Update task
    socket.on(EVENTS.update_task, (task, cb)=>{
        const user_id = socket.userId;        

        // Update user task
        const updated_task = updateUserTask(user_id, task);

        const payload = {
            socketId: socket.id,
            error:null,
            data:updated_task
        }

        // Return the payload with user's new task
        socket.to(user_id).emit(EVENTS.tasks_update, payload);
        cb(payload);
    });
    // Delete task
    socket.on(EVENTS.delete_task, (task_id, cb)=>{
        const user_id = socket.userId;        

        // Delete user task
        deleteUserTask(user_id, task_id);

        const payload = {
            socketId: socket.id,
            error:null,
            data:{
                task_id
            }
        }

        // Return the payload with user's new task
        socket.to(user_id).emit(EVENTS.remove_task, payload);
        cb(payload);
    });    
})


// Helpers

function getUserIdFromToken(token){
    // get user from data with token
    const user = true;

    if (user) return user._id;
    else return new Error("No user associated with token");
}

function getAuthUserTasks(user_id){
    // Load all the user tasks from db
    return []
}

function createUserTask(user_id, task){
    return task;
}

function updateUserTask(user_id, task){
    return task;
}

function deleteUserTask(user_id, task_id){
    return task_id;
}