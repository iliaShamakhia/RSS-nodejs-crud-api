import cluster from 'cluster';
import os from 'os';
import http, { IncomingMessage, ServerResponse } from 'http';
import { handleRequest } from './routes';
import { portOffset } from './utils';
import { db } from './db';

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
    switch (message.type) {
      case 'getSingle':
        let user = db.getUserById(message.userId || '');
        if (user) {
          worker.send({ status: 'success', data: user });
        } else {
          worker.send({ status: 'error' });
        }
      break;
      case 'getMany':
        worker.send({ status: 'success', data: db.getAllUsers() });
      break;
      case 'create':
        if (message.data) {
          const newUser = db.createUser(message.data.username, message.data.age, message.data.hobbies);
          worker.send({ status: 'success', data: newUser });
        }
      break;
      case 'update':
        if (message.userId && message.data) {
          const updatedUser = db.updateUser(message.userId, message.data.username, message.data.age, message.data.hobbies);
          if (updatedUser) {
            worker.send({ status: 'success', data: updatedUser });
          } else {
            worker.send({ status: 'error' });
          }
        }
      break;
      case 'delete':
        if (message.userId) {
          const isDeleted = db.deleteUser(message.userId);
          if (isDeleted) {
            worker.send({ status: 'success' });
          } else {
            worker.send({ status: 'error' });
          }
        }
      break;
      case 'user-exists':
        if (message.data) {
          const exists = db.getUserByUsername(message.data.username);
          if (exists) {
            worker.send({ status: 'success' });
          } else {
            worker.send({ status: 'error' });
          }
        }
      break;
    }
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
  const port = process.env.PORT;
  const server = http.createServer(handleRequest);
  
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}