import type { Server as SocketIOServer } from "socket.io";

let ioInstance: SocketIOServer | null = null;

export function setSocketServer(io: SocketIOServer) {
  ioInstance = io;
}

export function getSocketServer(): SocketIOServer | null {
  return ioInstance;
}

export function emitOrderUpdate(outletId: number, payload: unknown) {
  ioInstance?.to(`orders:outlet:${outletId}`).emit("order:updated", payload);
}

export function emitTableUpdate(outletId: number, payload: unknown) {
  ioInstance?.to(`tables:outlet:${outletId}`).emit("table:updated", payload);
}

export function emitKdsUpdate(stationCode: string, payload: unknown) {
  ioInstance?.to(`kds:${stationCode}`).emit("kds:updated", payload);
  ioInstance?.to("kds:ALL").emit("kds:updated", payload);
}
