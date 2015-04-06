import koa from 'koa';
import body from 'koa-parse-json';

import routes from './routes';

require('./traceur-runtime');

const app = koa();

app.use(body({limit: 10 * 1024 * 1024}));

routes(app);

const port = process.env.port || 3000;
app.listen(port);

console.log(`Listening on port ${port}`);


