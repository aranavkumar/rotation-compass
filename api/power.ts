import type { IncomingMessage, ServerResponse } from 'node:http';
import { power } from '../src/power';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const response = await power(new Request(new URL(req.url ?? '/api/power', 'https://rotation-compass.vercel.app')));
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
}
