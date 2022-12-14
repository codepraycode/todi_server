const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const io = require('socket.io')(3100);
const mongoose = require('mongoose');

// Body parser
app.use(bodyParser.json());

// Collections
const Tasks = require('./models');

mongoose.connect("mongodb://localhost:27017/todi_db", 
    {useNewUrlParser:true}, 
    
    (err)=>{
        if (err){
            throw err;
        }

        console.log("Database connected!");

        io.on("connection", (socket) => {
            console.log("A user is connected");

            socket.on("disconnect", () => {
                console.log("A user is disconnected");
            });

            socket.on('task:create', (data)=>{
                console.log("A new task");
                console.log(data);
            })

            socket.on('task:update', (data)=>{
                console.log("An updated task");
                console.log(data);
            });

            socket.on('task:delete', (taskId)=>{
                console.log("Delete a task");
                console.log(taskId);
            });
        
        });

    }
);


Tasks.watch().on('change', (changes)=>{
    console.log("Mongo: somthing has changed");
    io.to(changes.fullDocument._id).emit("changes", changes.fullDocument);
});