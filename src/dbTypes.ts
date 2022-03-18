export type FoodType = {
    id: number,
    name: string,
    calories: number,
    dietary_preferences: string[],
    serving_size: number,
    serving_size_units: string,
}

export type UserType = {
    id: number,
    firstname: string,
    lastname: string,
    email: string,
    log?: UserLogEntryType[]
}

export type UserLogEntryType = {
    [date: number]: UserLogDataType
}

export type UserLogDataType = {
    food: string,
    servingSize: number,
    calories: number
}