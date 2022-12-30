
let UserDb = [
    {
        _id: 1,
        username: 'user1',
        email:'user1@mail.com',
        password:'letmein',
        token:"token_1",
    },
    {
        _id: 2,
        username: 'user2',
        email:'user2@mail.com',
        password:'letmein',
        token:"token_2",
    },
    {
        _id: 3,
        username: 'user3',
        email:'user3@mail.com',
        password:'letmein',
        token:"token_3",
    },
]

const defaultTodo = [
    {
        task: "Jog around the park 3x",
        platform:'web',
    },
    {
        task: "10 minutes meditation",
        platform:'web',
    },
    {
        task: "Read for 1 hour",
        platform:'web',
    },
    {
        task: "Pick up groceries",        
        platform:'web',
    },
]

let TasksDb = [
    {
        _id: 1,
        task: "Jog around the park 3x",
        completed: true,
        platform:'web',
        user:1,
    },
    {
        _id: 2,
        task: "10 minutes meditation",
        completed: false,
        platform:'web',
        user:1,
    },
    {
        _id: 3,
        task: "Read for 1 hour",
        completed: false,
        platform:'web',
        user:1,
    },
    {
        _id: 4,
        task: "Pick up groceries",
        completed: false,
        platform:'web',
        user:1,
    },
]


module.exports = {UserDb, defaultTodo, TasksDb}