import cluster from 'cluster';
import os from 'os';
import http, { ServerResponse } from 'http';
import { handleRequest } from './routes';
import { portOffset } from './utils';

const PORT = parseInt(process.env.PORT || '4000', 10);
let workerport = 4000;

if (cluster.isPrimary) {
  const numCPUs = os.availableParallelism();
  console.log(`Master process is running. Forking ${numCPUs - 1} workers...`);

  for (let i = 0; i < numCPUs - 1; i++) {
    cluster.fork({ PORT: ++workerport });
  }
  
  const workers = Object.values(cluster.workers || {});
  let currentWorker = 0;
  
  const loadBalancer = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);

    req.on('end', () => {
      sendRequest('localhost', PORT + portOffset(workers.length), req.url || '/', req.method || 'GET', body, res);
      currentWorker = (currentWorker + 1) % workers.length;
    });
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

function sendRequest(hostname: string, port: number, path: string, method: string, data: any, resp: ServerResponse) {
  //const postData = JSON.stringify(data);

  const options = {
    hostname,
    port,
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  };

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        let parsedData = JSON.parse(responseData);
        resp.writeHead(res.statusCode || 500, { 'Content-Type': 'application/json' });
        resp.end(JSON.stringify(parsedData));
      } catch (e) {
        console.error('Failed to parse response:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`Problem with request: ${error.message}`);
    resp.writeHead(500, { 'Content-Type': 'application/json' });
    resp.end(JSON.stringify({ status: 500, message: 'Internal server error' }));
  });

  req.write(data);
  req.end();
}