import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(station?: string): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      query: { outletId: "1", ...(station ? { station } : {}) },
      autoConnect: true,
      reconnectionAttempts: 10,
    });
  }
  return socket;
}
