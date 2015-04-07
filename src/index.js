import koa from 'koa';
import gzip from 'koa-gzip';
import logger from 'koa-logger';
import body from 'koa-parse-json';
import _ from 'lodash';

import routes from './routes';

require('./traceur-runtime');

const app = koa();

app.use(logger());
app.use(gzip());
app.use(body({limit: 10 * 1024 * 1024}));

const {tokens, problems} = routes(app);

const port = process.env.port || 3000;
app.listen(port);

setInterval(() => collectGarbage(tokens, problems), 5 * 60 * 1000);
console.log(`Listening on port ${port}`);

function collectGarbage(tokens, problems) {
  const time = new Date().getTime();

  console.log('collecting', time);

  _.each(tokens, (tokenProfile, token) => {
    if (tokenProfile.problem === undefined && (time - tokenProfile.lastSolvedAt > (30 * 60 * 1000))) {
      delete tokens[token];
    }
  });
}