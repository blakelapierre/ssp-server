import _ from 'lodash';

module.exports = { generate, verify };

// Will generate an array of random integers of `length`, where
// each integer will be in the range [-`range`/2, `range`/ 2]
// integers will NOT be repeated
//
// length: integer
// range: integer
function generate(length, range) {
  if (range < length) throw new Error('length must be greater than max');

  const set = {};

  let generated = 0;

  while (generated < length) {
    const candidate = Math.round(Math.random() * range) - (range / 2);

    if (!set[candidate]) {
      set[candidate] = true;
      generated++;
    }
  }

  return Object.keys(set);
}


// Returns true iff:
//
// 1) The elements of `solution` sum to 0
// 2) Every element in `solution` exists in `problem`
//
// problem: array of integers
// solution: array of integers
function verify(problem, solution) {
  if (_.sum(solution) !== 0) throw new Error('solution does not sum to 0!');

  const set = _.transform(problem, (set, value) => {
    set[value] = true;
  });

  _.each(solution, value => {
    if (!set[value]) throw new Error(`value ${value} in solution, but not in problem!`);
  });

  return true;
}