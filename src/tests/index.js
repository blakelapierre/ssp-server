import ssp from 'ss-problem';

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


const profile = {lastParams: {length: 1, range: 1}};

for (var i = 0; i < 100000; i++) {
  profile.lastParams = getNewParams(profile);
  console.log(profile);
}

function getNewParams(profile) {
  let {length, range} = profile.lastParams;

  if (Math.log2(range / length) > Math.log2(length)) {
    length++;
    range = length;
  }
  else {
    range *= 2;
  }

  return {length, range};
}