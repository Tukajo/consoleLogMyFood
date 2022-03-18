#! /usr/bin/env node
import axios from 'axios';
import { createInterface} from "readline";
import {GET_FOOD_URL, GET_USER, POST_USER} from './constants';
import {FoodType} from './dbTypes';
const readLine = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'enter command >'
})

readLine.prompt();
readLine.on('line', async line => {
    switch(line.trim()) {
        case 'list vegan foods':
            {
                axios.get<FoodType[]>(GET_FOOD_URL).then(({data})=>{
                    let idx = 0;
                    const veganOnly = data.filter(food=>food.dietary_preferences.includes("vegan"))
                    const veganIterable = {
                        [Symbol.iterator]() {
                            return {
                                [Symbol.iterator]() { return this; },
                                next() {
                                    const current = veganOnly[idx];
                                    idx++;
                                    if(current != null) {
                                        return { value: current, done: false }
                                    } else {
                                        return { value: current, done: true }
                                    }
                                }
                            }
                        }
                    };
                    for(let val of veganIterable){
                        console.log(val.name);
                    }
                    readLine.prompt();
                 })
            }
            break;
        case 'log':
            {
                const askForServingSize = (food: FoodType) => {
                    readLine.question('How many servings did you eat? (enter as a decimal, or whole integer)', amountEaten => {
                        if(amountEaten === 'nevermind' || amountEaten === 'n'){
                            actionIt.return();
                        }
                        actionIt.next(amountEaten, food);
                    })
                }
               const displayCalories = async (servingSize:string, food: FoodType) => {
                    const foodCalories = food.calories
                    const servingSizeNum = parseFloat(servingSize)
                    const calcServingSizeCalories = (foodCalories * servingSizeNum);
                    console.log(`${food.name} with a serving size of ${servingSize}, has ${calcServingSizeCalories} calories`)
                    const { data } = await axios.get(`${GET_USER}/1`);
                    const usersLog = data.log || [];
                    const postBody = {
                        ...data,
                        log: [...usersLog,
                            {
                                [Date.now()]: {
                                    food: food.name,
                                    servingSize,
                                    calories:calcServingSizeCalories
                                }
                            }]
                    }
                    await axios.put(`${POST_USER}/1`,postBody,{
                        headers: { 'Content-Type': 'application/json' }
                    })
                    actionIt.next();
                    readLine.prompt();
                }
                const actionIterator= {
                    [Symbol.iterator]() {
                        let allActions = [...this.actions]
                        return {
                            [Symbol.iterator]() { return this },
                            next(...args: any[]) {
                                if(allActions.length > 0){
                                    const currentAction = allActions.shift();
                                    const result = currentAction(...args)
                                    return { value: result, done: false}
                                } else {
                                    return { done: true}
                                }
                            },
                            return() {
                                allActions = [];
                                return { done: true };
                            },
                            throw(error: string) {
                                console.error(error);
                                return { value: undefined, done: true };
                            }
                        }
                    },
                    actions: [askForServingSize, displayCalories],
                };

                const {data} = await axios.get<FoodType[]>(GET_FOOD_URL)
                const iter = data[Symbol.iterator]();
                let actionIt  = actionIterator[Symbol.iterator]();


                readLine.question(`What would you like to log today? `, async (item: any) => {
                    let position = iter.next();
                    while (!position.done) {
                        if (item === position.value.name) {
                            console.log(`${item} has ${position.value.calories} calories`)
                            actionIt.next(position.value);
                        }
                        position = iter.next();
                    }
                    readLine.prompt();
                })
            }
            break;

    }
})

