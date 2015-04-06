import route from 'koa-route';
import uuid from 'uuid';
import _ from 'lodash';

import ssp from 'ss-problem';

module.exports = app => {
  app.use(route.get('/problem/:token?', getProblem));
  app.use(route.post('/solution/:id', postSolution));

  const problems = {},
        tokens = {};

  function* getProblem(token = uuid.v4()) {
    console.log(this.request);
    const body = this.request.body;

    const profile = tokens[token] = tokens[token] || {problems: []};

    const max = 10000,
          length = 100,
          id = uuid.v4();

    if (problems[id]) throw new Error('Woah! Conflicting problem uuid!');

    profile.problems.push(id);

    const problem = problems[id] = ssp.generate(length, max);

    this.body = JSON.stringify({
      id,
      token,
      params: {
        length,
        max
      },
      problem
    });
  }

  function* postSolution(id) {
    console.log('solution for', id);
    const problem = problems[id];

    if (!problem) {
      this.body = JSON.stringify({verified: false, message: 'Not a valid problemm id!'});
      return;
    }

    const body = this.request.body,
          {token, solution} = body,
          profile = tokens[token];

    if (!profile) {
      this.body = JSON.stringify({verified: false, message: 'Not a valid token!'});
      return;
    }

    const index = profile.problems.indexOf(id);
    if (index < 0) {
      this.body = JSON.stringify({verified: false, message: 'Not a valid problem id!'});
      return;
    }

    profile.problems.splice(index, 1);

    try {
      ssp.verify(problem, solution);
      this.body = JSON.stringify({verified: true});
    }
    catch (e) {
      this.body = JSON.stringify({verified: false, message: e.message});
    }
  }
};