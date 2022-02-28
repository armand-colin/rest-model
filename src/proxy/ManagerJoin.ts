import { Entity, EntityManager } from "..";

type JoinEntities = Record<string, Entity>;

type F<E extends JoinEntities> = {
    [K in keyof E]: string
}

type Foreign<E extends JoinEntities> = {
    [K in keyof E]: Set<string>
}

type JoinT<P, E> = {
    entities: E;
    payload: P;
}


export default class ManagerJoin<P = {}, E extends JoinEntities = {}> {

    private _entries: Map<string, F<E>>
    private _foreign: Foreign<E>

    constructor(managers: JoinT<P, E>) {
        this._entries = new Map()
        
        const foreign: Partial<Foreign<E>> = { }
        for (const key in managers.entities)
            foreign[key] = new Set()

        this._foreign = foreign as Foreign<E>
    }

    protected add(...entries: F<E>[]) {
        for (const entry of entries) {
            const token = JSON.stringify(entry)
            if (this._entries.has(token))
                continue;
            this._entries.set(token, entry)
            for (const key in entry)
                this._foreign[key].add(entry[key])
        }
    } 
}

interface User extends Entity {
    name: string;
}

class UserManager extends EntityManager<User> {
    public static instance = new UserManager()
}

// const FriendJoin = new ManagerJoin({ 
//     user: UserManager.instance, 
//     friend: UserManager.instance 
// })