const CHAT_ROOMS=new Set(["GENERAL","TECH_SUPPORT"])

io.on('connection', (socket) => {  
  socket.on('join room', (room,ack) => {

    if(typeof room !== 'string' || !CHAT_ROOMS.has(room)){
      ack({ success: false, message: "Invalid room" });
      return;
    }

    for (const joinedRoom of socket.rooms) {
      if (CHAT_ROOMS.has(joinedRoom)) {
        socket.leave(joinedRoom);
      }
    }
    socket.join(room);
    ack?.({ success: true });
  });

  socket.on("typing", (payload, ack) => {
    const room=[...socket.rooms].find((r)=> CHAT_ROOMS.has(r));
    if(!room){
      ack?.({ success: false, message: "You are not in a room" });
      return;
    }
    socket.to(room).emit("typing", {
    room,
    socketId: socket.id,
    isTyping: payload.isTyping,
  });   
  
  ack?.({ success: true });
  });

  socket.on("chat message", (message, ack) => {
    const room=[...socket.rooms].find((r)=> CHAT_ROOMS.has(r));
    if(!room){
      ack?.({ success: false, message: "You are not in a room" });
      return;
    }

    if (typeof message !== 'string' || !message.trim() || message.trim().length > 1000) {
      ack?.({ error: 'Message must be between 1 and 1000 characters' });
      return;
    }

    io.to(room).emit("chat message",{
      id: `${socket.id} - ${Date.now()}`,
      message: message.trim(),
      room
    });

    ack?.({ success: true })
  })

  socket.on('disconnect', () => {  
    console.log(`Client terputus: ${socket.id}`);  
  });  
}); 