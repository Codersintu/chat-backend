import { Server } from "socket.io";
import express from "express";
import {createServer} from "http";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://chat-rose-pi-10.vercel.app"
  }
});

const CHAT_ROOMS =new Set(["GENERAL","TECH_SUPPORT"]);


io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join room", (room,ack) => {
    if(typeof room !== "string" || !CHAT_ROOMS.has(room)){
      ack({ success: false, message: "Invalid room" });
      return;
    }

    for(const joinedRoom of socket.rooms){
      if(CHAT_ROOMS.has(joinedRoom)){
        socket.leave(joinedRoom);
        console.log(`Client left room ${joinedRoom}`);
      }
    }

    socket.join(room);
    console.log(`Client joined room ${room}`);
    ack?.({ success: true, message: `Joined room ${room}` });

  })

  socket.on("typing",(payload,ack)=>{
    const room=[...socket.rooms].find((r)=>CHAT_ROOMS.has(r));

    if(!room){
      console.error("Client is not in any valid room");
      return;
    }

    io.to(room).emit("typing",{
      room,
      socketId:socket.id,
      isTyping:payload.isTyping
    })

    ack?.({success:true})

  })

  socket.on("chat message", (message, ack) => {
    const room=[...socket.rooms].find((room) => CHAT_ROOMS.has(room));
    if(!room){
      console.error("Client is not in any valid room");
      return;
    }

     if (typeof message !== 'string' || !message.trim() || message.trim().length > 1000) {
      ack?.({ error: 'Message must be between 1 and 1000 characters' });
      return;
    }
    
    io.to(room).emit("chat message", {
      id: `${socket.id}-${Date.now()}`,
      message: message,
      room: room
    });

    ack?.({ success: true, message: "Message sent" });
  })


  socket.on('disconnect', () => {  
    console.log(`Client terputus: ${socket.id}`);  
  }); 

})


 




const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {  
  console.log(`Server running in port ${PORT}`);  
}); 