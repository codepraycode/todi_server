const {
    signInUser,
    createNewUser
} = require('./services');


module.exports = (io, socket, EVENTS)=>{
    
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
}