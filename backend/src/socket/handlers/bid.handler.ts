import { Server, Socket } from 'socket.io'

export function registerBidHandlers(io: Server, socket: Socket) {
  socket.on('room:join', (roomId: string) => {
    socket.join(roomId)
    io.to(roomId).emit('room:update', { event: 'player_joined', socketId: socket.id })
  })

  socket.on('bid:submit', (data: { roomId: string; itemIndex: number; amount: number }) => {
    // TODO: validate, store in Redis, resolve when both bids received
    socket.to(data.roomId).emit('bid:received', { itemIndex: data.itemIndex })
  })
}
