import cluster from 'cluster';
import os from 'os';
import http from 'http';
import { handleRequest } from './routes';
import { portOffset } from './utils';
import { db } from './db';

const PORT = parseInt(process.env.PORT || '4000', 10);
let workerport = 4000;

if (cluster.isPrimary) {
  const numCPUs = os.availableParallelism();
  console.log(`Master process is running. Forking ${numCPUs - 1} workers...`);

  for (let i = 0; i < numCPUs - 1; i++) {
    cluster.fork({ PORT: ++workerport });
  }

  const workers = Object.values(cluster.workers || {});

  cluster.on('message', (worker, message) => {
    if (message.type === 'update') {
      workers.forEach((w) => {
        if (w !== worker) {
          w?.send(message);
        }
      });
    }
  });

  const loadBalancer = http.createServer((req, res) => {

    const options = {
      hostname: 'localhost',
      port: PORT + portOffset(workers.length),
      path: req.url,
      method: req.method,
      headers: req.headers
    };

    const requestToWorker = http.request(options, (responseFromWorker) => {
      res.writeHead(responseFromWorker.statusCode || 500, responseFromWorker.headers);
      responseFromWorker.pipe(res);
    });

    req.pipe(requestToWorker);
  });

  loadBalancer.listen(PORT, () => {
    console.log(`Load balancer running on port ${PORT}`);
  });

} else {
  process.on('message', (message: any) => {
    if (message.type === 'update') {
      db.setUsers(message.data);
    }
  });

  const port = process.env.PORT;
  const server = http.createServer(handleRequest);
  
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}