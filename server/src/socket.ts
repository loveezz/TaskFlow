import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function setupSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: { origin: '*', credentials: true }
  });

  io.on('connection', (socket) => {
    socket.on('channel:join', (channelId: string) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('message:send', async (data: { channelId: string; content: string; userId: string }) => {
      const message = await prisma.message.create({
        data: { channelId: data.channelId, content: data.content, authorId: data.userId },
        include: { author: true }
      });
      io.to(`channel:${data.channelId}`).emit('message:new', message);
    });
  });

  return io;
}

