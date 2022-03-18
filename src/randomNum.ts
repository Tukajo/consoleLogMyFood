function* randomNum(){
    while(true){
        yield Math.floor(Math.random()*100);
    }
}

const randomGenerator = randomNum();
const getRandomNumber = (): number => {
    return randomGenerator.next().value || 0;
}

console.log(getRandomNumber())