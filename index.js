require("dotenv").config();

const express = require("express");
const { createServer } = require("http");
const registerTaskHandler = require('./lib/tasks');
const registerAuthHandler = require('./lib/authentication');

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

const onConnection = (socket) =>{
    registerAuthHandler(io, socket, EVENTS);
    registerTaskHandler(io, socket, EVENTS);
};

io.on('connection', onConnection);


httpServer.listen(PORT, ()=>{
    console.log("Listening on port", PORT)
});


