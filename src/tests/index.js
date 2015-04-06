import ssp from '../ssp';

console.log(ssp);

console.log(ssp.generate(1000, 10000000));


check([], [-1, -4, 5]);
check([], [1]);

check([-1, -4, 5], [0]);
check([-1, -4, 5], [-1, -4, 5]);
check([-1, -4, 5, 1, 3], [1, 3, -4]);

function check(problem, solution) {
  try {
    ssp.verify(problem, solution);
    console.log('pass');
  }
  catch (e) {
    console.log(e);
  }
}