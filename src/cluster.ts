import cluster from 'cluster';
import os from 'os';
import http, { IncomingMessage, ServerResponse } from 'http';
import { handleRequest } from './routes';
import { portOffset } from './utils';
import { db } from './db';
import { type UpdateMessage } from './types';

const PORT = parseInt(process.env.PORT || '4000', 10);
let workerport: number = 4000;

if (cluster.isPrimary) {
  const numCPUs: number = os.availableParallelism();
  console.log(`Master process is running. Forking ${numCPUs - 1} workers...`);

  for (let i = 0; i < numCPUs - 1; i++) {
    cluster.fork({ PORT: ++workerport });
  }

  const workers = Object.values(cluster.workers || {});

  cluster.on('message', (worker, message) => {
      workers.forEach((w) => {
        if (w !== worker) {
          w?.send(message);
        }
      });
  });

  const loadBalancer = http.createServer((req: IncomingMessage, res: ServerResponse) => {

    const options = {
      hostname: 'localhost',
      port: PORT + portOffset(workers.length),
      path: req.url,
      method: req.method,
      headers: req.headers
    };

    const requestToWorker = http.request(options, (responseFromWorker: IncomingMessage) => {
      res.writeHead(responseFromWorker.statusCode || 500, responseFromWorker.headers);
      responseFromWorker.pipe(res);
    });

    req.pipe(requestToWorker);
  });

  loadBalancer.listen(PORT, () => {
    console.log(`Load balancer running on port ${PORT}`);
  });

} else {
  process.on('message', (message: UpdateMessage) => {
      db.setUsers(message.data);
  });

  const port = process.env.PORT;
  const server = http.createServer(handleRequest);
  
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}