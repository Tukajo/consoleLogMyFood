#! /usr/bin/env node
import axios from 'axios';
import { createInterface} from "readline";
import {GET_FOOD_URL, GET_USER, GET_USER_BY_EMAIL, POST_USER} from './constants';
import {FoodType, UserLogDataType, UserType} from './dbTypes';
const readLine = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'enter command >'
})

const MAX_CALORY_LIMIT = 12000;

readLine.prompt();
readLine.on('line', async line => {
    switch(line.trim()) {
        case 'list vegan foods':
        {
             const { data }  = await axios.get<FoodType[]>(GET_FOOD_URL);
             function* listVeganFoods() {
                 let idx = 0;
                 const veganOnly = data.filter(food => food.dietary_preferences.includes("vegan"))
                 while(veganOnly[idx]) {
                     yield  veganOnly[idx];
                     idx++;
                 }
             }
            for(let val of listVeganFoods()){
                console.log(val.name);
            }
            readLine.prompt();
        }
        break;
        case 'log':
        {
            function* actionGenerator() {
                const food: FoodType = yield;
                const servingSize: number = yield askForServingSize();
                yield displayCalories(servingSize, food);
            }

            const {data} = await axios.get<FoodType[]>(GET_FOOD_URL)
            const iter = data[Symbol.iterator]();
            let actionGen  = actionGenerator();

            const askForServingSize = (): any => {
                readLine.question('How many servings did you eat? (enter as a decimal, or whole integer)', amountEaten => {
                    if(amountEaten === 'nevermind' || amountEaten === 'n'){
                        actionGen.return();
                    }
                    // @ts-ignore
                    actionGen.next(amountEaten);
                })
            }
            const displayCalories = async (servingSize: number, food: FoodType) => {
                const foodCalories = food.calories
                const servingSizeNum = servingSize
                const calcServingSizeCalories = (foodCalories * servingSizeNum);
                console.log(`${food.name} with a serving size of ${servingSize}, has ${calcServingSizeCalories} calories`)
                const {data} = await axios.get(`${GET_USER}/1`);
                const usersLog = data.log || [];
                const postBody = {
                    ...data,
                    log: [...usersLog,
                        {
                            [Date.now()]: {
                                food: food.name,
                                servingSize,
                                calories: calcServingSizeCalories
                            }
                        }]
                }
                await axios.put(`${POST_USER}/1`, postBody, {
                    headers: {'Content-Type': 'application/json'}
                })
                actionGen.next();
                readLine.prompt();
            }

            readLine.question(`What would you like to log today? `, async (item: any) => {
                let position = iter.next();
                while (!position.done) {
                    if (item === position.value.name) {
                        console.log(`${item} has ${position.value.calories} calories`)
                        actionGen.next();
                        // @ts-ignore
                        actionGen.next(position.value);
                    }
                    position = iter.next();
                }
                readLine.prompt();
            })
        }
        break;
        case `today's log`:
        {
            readLine.question('Email: ', async emailAddress => {
                const { data } = await axios.get<UserType[]>(GET_USER_BY_EMAIL(emailAddress));
                const foodLogOnUser = data[0].log || []
                let totalCalories = 0;
                function* getFoodLog() {
                    yield* foodLogOnUser
                }
                const logIterator = getFoodLog();
                for(const entry of logIterator){
                    const timestamp = Number(Object.keys(entry)[0]);
                    if(isTimestampFromToday(new Date(timestamp))) {
                        const entryData: UserLogDataType = entry[timestamp]
                        console.log(`${entryData.food}, ${entryData.servingSize} serving(s)`)
                        totalCalories += entryData.calories
                        if(totalCalories >= MAX_CALORY_LIMIT) {
                            console.log(`Impressive! You've reached ${MAX_CALORY_LIMIT} calories!`)
                            logIterator.return();
                        }
                    }
                }
                console.log('------------------------')
                console.log(`Total calories: ${totalCalories}`)
                readLine.prompt();
            })
        }
        break;
    }
})

const isTimestampFromToday = (timestamp: Date): boolean => {
    const today = new Date();
    return timestamp.getDate() === today.getDate() && timestamp.getMonth() === today.getMonth() &&  timestamp.getFullYear() === today.getFullYear();
}

