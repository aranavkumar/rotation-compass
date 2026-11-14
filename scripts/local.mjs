import './build-planner.mjs';
const {default:worker}=await import('../dist/server/index.js');
import {createServer} from 'node:http';
createServer(async(req,res)=>{try{const result=await worker.fetch(new Request(new URL(req.url,'http://localhost:4173')));res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text())}catch{res.writeHead(500);res.end()}}).listen(4173,'127.0.0.1',()=>console.log('Rotation Compass: http://localhost:4173'));
