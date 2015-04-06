import route from 'koa-route';
import uuid from 'uuid';
import _ from 'lodash';

import ssp from 'ss-problem';

module.exports = app => {
  app.use(route.get('/problem/:token?', getProblem));
  app.use(route.post('/solution/:id', postSolution));

  const problems = {},
        tokens = {};

  function* getProblem(token) {
    console.log(this.request);
    const body = this.request.body;

    if (!token) {
      token = uuid.v4();
      console.log(`new token! ${token}`);
    }

    const profile = tokens[token] = tokens[token] || {};

    const range = 1000000,
          length = 1000,
          id = uuid.v4();

    if (problems[id]) throw new Error('Woah! Conflicting problem uuid!');

    profile.problem = id;

    const params = {length, range},
          problem = ssp.generate(length, range);

    problems[id] = {params, problem};

    console.log(`new problem! ${id} length: ${length} range: ${range}`);

    this.body = JSON.stringify({
      id,
      token,
      params,
      problem
    });

    profile.generatedAt = new Date().getTime();
  }

  function* postSolution(id) {
    const receivedAt = new Date().getTime();

    const problemDef = problems[id];

    if (!problemDef) {
      const message = 'Not a valid problem id!';
      console.log(message);
      this.body = JSON.stringify({verified: false, message});
      return;
    }

    const body = this.request.body,
          {token, solution} = body,
          profile = tokens[token];

    if (!profile) {
      const message = 'Not a valid token!';
      console.log(message);
      this.body = JSON.stringify({verified: false, message});
      return;
    }

    if (profile.problem !== id) {
      const message = 'Not a valid problem id!';
      console.log(message);
      this.body = JSON.stringify({verified: false, message});
      return;
    }

    console.log(`solution received for ${id}`);

    profile.problem = undefined;

    const {problem} = problemDef;

    try {
      ssp.verify(problem, solution);
      const spent = receivedAt - profile.generatedAt;
      console.log(`problem ${id} solved in ${spent}ms`);
      this.body = JSON.stringify({verified: true, time: spent});
    }
    catch (e) {
      this.body = JSON.stringify({verified: false, message: e.message});
    }
  }
};