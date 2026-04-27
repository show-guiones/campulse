// api/hls-proxy.js — DEPRECATED
// El player ahora usa el embed oficial de Chaturbate directamente desde el cliente.
// Este endpoint ya no es necesario pero se mantiene para no generar 404s en logs.
export const config = { runtime: 'edge' };
export default function handler(req) {
  return new Response(JSON.stringify({ deprecated: true, message: 'Use embed player instead' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
