A subset sum problem generator and verifier.

````
git clone https://github.com/blakelapierre/ssp
cd ssp
npm install
npm install -g gulpur

gulpur build
gulpur test
````

The library is output to `.dist/ssp.js`

##ssp API

    // Will generate an array of random integers of `length`, where
    // each integer will be in the range [-`range`/2, `range`/ 2]
    // integers will NOT be repeated
    generate(length, range)

    // Returns true iff:
    //
    // 1) The elements of `solution` sum to 0
    // 2) Every element in `solution` exists in `problem`
    //
    // problem: array of integers
    // solution: array of integers
    verify(problem, solution)
