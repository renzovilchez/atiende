/**
 * Inicialización de Socket.io.
 * En Fase 3 se agrega la lógica de eventos en tiempo real.
 * Por ahora solo maneja conexión/desconexión y aislamiento por tenant.
 */
function initSocketIO(io) {
  io.on('connection', (socket) => {
    const { tenantId, userId } = socket.handshake.auth;

    if (!tenantId) {
      socket.disconnect(true);
      return;
    }

    // Unirse a la sala del tenant — aislamiento de eventos entre clínicas
    socket.join(`tenant:${tenantId}`);
    console.log(`[Socket] User ${userId} connected → tenant:${tenantId}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${userId} disconnected`);
    });
  });
}

/**
 * Emitir un evento a todos los clientes de un tenant.
 * Uso: emitToTenant(io, tenantId, 'appointment:updated', { id, status })
 */
function emitToTenant(io, tenantId, event, data) {
  io.to(`tenant:${tenantId}`).emit(event, data);
}

module.exports = { initSocketIO, emitToTenant };
