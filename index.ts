import express, { type NextFunction, type Request, type Response } from 'express';
import client from 'prom-client';

const app = express();

const reqConterClient = new client.Counter({
  name: 'http_req_total',
  help: 'Total number of req',
  labelNames: ['methods', 'routes', 'status_code']
})

const reqGauge = new client.Gauge({
  name: 'active_requests',
  help: 'Number of active requests'
})

const reqMonitor = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 3000, 5000]
})

function middleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  reqGauge.inc()

  res.on('finish', () => {

    const end = Date.now();
    const duration = end - start;
    reqConterClient.inc({
      methods: req.method,
      routes: req.route ? req.route.path : req.route,
      status_code: res.statusCode
    })

    reqMonitor.observe({
      method: req.method,
      route: req.route ? req.route.path : req.route,
      code: res.statusCode
    }, duration)

    reqGauge.dec()
  })
  next()
}

app.use(middleware)

app.get('/cpu', (req, res) => {
  res.json({
    msg: '/cpu'
  })
});

app.get('/', (req, res) => {
  res.json({
    msg: '/'
  })
});

app.get('/user', (req, res) => {
  res.json({
    msg: '/user'
  })
});

app.get('/metrix', async (req, res) => {
  const metrix = await client.register.metrics();
  res.set('Content-Type', client.register.contentType)
  res.end(metrix)
});

app.listen(3000)

