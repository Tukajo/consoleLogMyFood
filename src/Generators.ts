#! /usr/bin/env node
function *timestampGenerator() {
    let ts = Date.now();
    console.log(`Original TS: ${ts}`)
    yield ts;
    // @ts-ignore
    let additionalTime = yield;
    console.log(`additionalTime: ${additionalTime}`)
    if(additionalTime){
        ts = ts + additionalTime;
    }
    console.log(`Updated TS: ${ts}`);
}

const iter = timestampGenerator();
const originalTimestamp = iter.next();
console.log(originalTimestamp);
iter.next(60*60);
iter.next(60*45);

