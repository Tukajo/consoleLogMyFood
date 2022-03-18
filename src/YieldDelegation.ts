#! /usr/bin/env node
// Yield Delegation.
/*function* gen1() {
    yield 1;
    yield 2;
    return 4;
}*/

function gen1() {
    return ['three', 'six', 'nine']
}

function* gen2() {
    yield* gen1();
}
const gen = gen2();
console.log(gen.next());
console.log(gen.next());
console.log(gen.next());
console.log(gen.next());