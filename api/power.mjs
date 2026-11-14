import worker from '../dist/server/index.js';

export default async function handler(req, res) {
  const response = await worker.fetch(new Request(new URL(req.url ?? '/api/power', 'https://rotation-compass.vercel.app')));
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
}
