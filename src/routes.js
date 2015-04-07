import fs from 'fs';

import route from 'koa-route';
import uuid from 'uuid';
import _ from 'lodash';
import mkdirp from 'mkdirp';

import ssp from 'ss-problem';
import promise from 'promise-callback';

const dataDir = process.env.data_dir || 'data';

module.exports = app => {
  app.use(route.get('/problem/:token?', getProblem));
  app.use(route.post('/solution/:id', postSolution));
  app.use(route.get('/stats', getStats));
  app.use(route.get('/stats/problem/:id', getStatsProblem));
  app.use(route.get('/stats/tokens/:token', getStatsToken));

  const problems = {},
        tokens = {};

  return {problems, tokens};

  function* getProblem(token) {
    console.log(this.request);
    const body = this.request.body;

    if (!token) {
      token = uuid.v4();
      console.log(`new token! ${token}`);
    }

    const tokenProfile = tokens[token] = tokens[token] || {lastParams: {length: 1, range: 1}};

    if (problems[id]) {
      this.status = 500;
      this.body = 'Woah! Conflicting problem uuid!';
      return;
    }

    if (tokenProfile.problem) {
      delete problems[tokenProfile.problem];
      delete tokens[token];

      this.status = 500;
      this.body = 'Didn\'t solve last problem. Generate a new token!';
      return;
    }

    const {id, params, problem} = generateProblem(tokenProfile);

    tokenProfile.problem = id;
    tokenProfile.lastParams = params;

    problems[id] = {params, problem};

    writeProblem(token, id, params, problem);

    const {length, range} = params;
    console.log(`new problem! ${id} length: ${length} range: ${range}`);

    this.body = JSON.stringify({
      id,
      token,
      params,
      problem
    });

    tokenProfile.generatedAt = new Date().getTime();
  }

  function* postSolution(id) {
    const receivedAt = new Date().getTime();

    const problemDef = problems[id];

    if (!problemDef) {
      const message = 'Not a valid problem id!';
      console.log(message);

      this.status = 500;
      this.body = JSON.stringify({verified: false, message});
      return;
    }

    const body = this.request.body,
          {token, solution} = body,
          tokenProfile = tokens[token];

    if (!tokenProfile) {
      const message = 'Not a valid token!';
      console.log(message);

      this.status = 500;
      this.body = JSON.stringify({verified: false, message});
      return;
    }

    if (tokenProfile.problem !== id) {
      const message = 'Not a valid problem id!';
      console.log(message);

      this.status = 500;
      this.body = JSON.stringify({verified: false, message});
      return;
    }

    console.log(`solution received for ${id}`);

    tokenProfile.problem = undefined;
    tokenProfile.lastSolvedAt = receivedAt;

    delete problems[id];

    const {params, problem} = problemDef;

    try {
      const verified = ssp.verify(problem, solution);
      const spent = receivedAt - tokenProfile.generatedAt;

      writeSolution(token, id, params, solution, spent, verified);

      if (verified === undefined) {
        console.log(`problem ${id} marked as no solution in ${spent}ms`);
        this.body = JSON.stringify({verified: false, time: spent, message: 'Marked as no solution. Could not verify. Proceed.'});
      }
      else if (verified) {
        console.log(`problem ${id} solved in ${spent}ms`);
        this.body = JSON.stringify({verified: true, time: spent});
      }
      else {
        console.log('should never reach this point!');
      }
    }
    catch (e) {
      this.body = JSON.stringify({verified: false, message: e.message});
    }
  }

  function* getStats() {
    this.body = JSON.stringify({tokens, problems: _.mapValues(problems, problem => { return problem.params; })});
  }

  function* getStatsProblem(id) {
    this.body = JSON.stringify(problems[id]);
  }

  function* getStatsToken(token) {
    this.body = tokens[token];
  }
};

function generateProblem(tokenProfile) {
  const id = uuid.v4(),
        params = getNewParams(tokenProfile),
        {length, range} = params,
        problem = ssp.generate(length, range);

  return {id, params, problem};
}

function getNewParams(tokenProfile) {
  let {length, range} = tokenProfile.lastParams;

  if (Math.log2(range / length) > Math.log2(length)) {
    length++;
    range = length;
  }
  else {
    range *= 2;
  }

  return {length, range};
}

function writeProblem(token, id, params, problem) {
  const {length, range} = params,
        directory = `${dataDir}/tokens/${token}/${length}/${range}/${id}`;

  promise(mkdirp, directory)
    .then(() => promise(fs.writeFile, `${directory}/problem`, JSON.stringify(problem)))
    .then(() => console.log(`Wrote problem ${id} to ${directory}`));
}

function writeSolution(token, id, params, solution, timeSpent, verified) {
  const {length, range} = params,
        directory = `${dataDir}/tokens/${token}/${length}/${range}/${id}`;

  promise(mkdirp, directory)
    .then(() => promise(fs.writeFile, `${directory}/solution`, JSON.stringify({solution, timeSpent})))
    .then(() => console.log(`Wrote solution ${id} to ${directory}`))
    .then(() => updateTokenStats(token, id, params, solution, timeSpent, verified))
    .then(() => updateTokenMetrics(token, params, timeSpent, verified));
}

function updateTokenStats(token, id, params, solution, timeSpent, verified) {
  const directory = `${dataDir}/tokens/${token}`;

  return getTokenStats(token)
          .then(stats => {
            stats.solved = stats.solved || 0;
            stats.verified = stats.verified || 0;
            stats.solved++;
            if (verified) stats.verified++;

            return stats;
          })
          .then(stats => {
            return promise(fs.writeFile, `${dataDir}/tokens/${token}/stats`, JSON.stringify(stats));
          });
}

function getTokenStats(token) {
  return new Promise((resolve, reject) => {
    const directory = `${dataDir}/tokens/${token}`;

    promise(fs.readFile, `${directory}/stats`)
      .then(
        contents => resolve(JSON.parse(contents)),
        error => {
          resolve({});
        });
  });
}

function updateTokenMetrics(token, params ,timeSpent, verified) {
  const file = `${dataDir}/tokens/${token}/metrics`,
        {length, range} = params,
        data = `${length} ${range} ${timeSpent} ${verified}\n`;

  return promise(fs.appendFile, file, data);
}