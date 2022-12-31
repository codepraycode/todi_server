const {    
    getUserIdFromToken,
    getAuthUserTasks,
    createUserTask,
    updateUserTask,
    deleteUserTask,
    clearUserCompletedTask,
} = require('./services');

module.exports = (io, socket, EVENTS)=>{
    
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
                next(new Error("Invalid auth token"));
            }
            
        }else{
            // send an connection error message
            next(new Error("Authentication is required!"));
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

}