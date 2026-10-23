// Cloudflare Pages Functions: /api/*
import backend from '../../worker.js';
export async function onRequest(context) {
  return backend.fetch(context.request, context.env);
}
