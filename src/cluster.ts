import cluster from 'cluster';
import os from 'os';
import http from 'http';
import { handleRequest } from './routes';

const PORT = parseInt(process.env.PORT || '4000', 10);

if (cluster.isPrimary) {
  const numCPUs = os.availableParallelism();
  console.log(`Master process is running. Forking ${numCPUs - 1} workers...`);

  for (let i = 0; i < numCPUs - 1; i++) {
    cluster.fork();
  }

  const workers = Object.values(cluster.workers || {});
  let currentWorker = 0;

  const loadBalancer = http.createServer((req, res) => {
    const worker = workers[currentWorker];
    worker?.send({ req, res });
    currentWorker = (currentWorker + 1) % workers.length;
  });

  loadBalancer.listen(PORT, () => {
    console.log(`Load balancer running on port ${PORT}`);
  });
} else {
  process.on('message', ({ req, res }) => {
    handleRequest(req, res);
  });
}