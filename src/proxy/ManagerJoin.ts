import EventEmitter from "events";
import { Entity, EntityManager } from "..";
import { Observer } from "./IObservable";

type JoinEntities = Record<string, Entity>;

type EntryKey<E extends JoinEntities> = {
    [K in keyof E]: string
}

type ForeignKeys<E extends JoinEntities> = {
    [K in keyof E]: Map<string, Set<string>>
}

type Managers<E extends JoinEntities> = {
    [K in keyof E]: EntityManager<E[K]>
}

type Entry<E extends JoinEntities, P> = {
    id: string;
    key: EntryKey<E>
    entities: Partial<E>
    payload?: P
}

type Listener<E, K extends keyof E> = {
    created: (entities: E[K][]) => void;
    updated: (entities: E[K][]) => void;
    deleted: (ids: string[]) => void;
}

type Listeners<E extends JoinEntities> = {
    [K in keyof E]: Listener<E, K>
}

type UpdateEntry<E extends JoinEntities, P> = {
    key: EntryKey<E>
    payload?: P
}

interface Events<E extends JoinEntities, P> {
    created: CompleteEntry<E, P>[]
    updated: CompleteEntry<E, P>[]
    deleted: string[]
}

interface CompleteEntry<E extends JoinEntities, P> {
    id: string;
    key: EntryKey<E>;
    entities: E;
    payload: P extends undefined ? never : P
}

export default class ManagerJoin<P = undefined, E extends JoinEntities = {}> {

    private _entries: Map<string, Entry<E, P>>
    private _completeEntries: Set<string>
    private _foreignKeys: ForeignKeys<E>
    private _listeners: Listeners<E>
    private _emitter: EventEmitter;

    constructor(private managers: Managers<E>, private hasPayload = false) {
        this._entries = new Map()
        this._completeEntries = new Set()

        const foreignKeys: Partial<ForeignKeys<E>> = {}
        const listeners: Partial<Listeners<E>> = {}

        for (const key in managers) {
            foreignKeys[key] = new Map()
            const listener: Listener<E, typeof key> = {
                created: (entities: E[keyof E][]) => this.onEntitiesCreated(key, entities),
                updated: (entities: E[keyof E][]) => this.onEntitiesUpdated(key, entities),
                deleted: (ids: string[]) => this.onEntitiesDeleted(key, ids)
            }
            managers[key].on('created', listener.created)
            managers[key].on('updated', listener.updated)
            managers[key].on('deleted', listener.deleted)
            listeners[key] = listener
        }

        this._foreignKeys = foreignKeys as ForeignKeys<E>;
        this._listeners = listeners as Listeners<E>;
        this._emitter = new EventEmitter()
    }

    protected onEntitiesCreated<K extends keyof E>(key: K, entities: E[K][]) {
        const foreignKeys = this._foreignKeys[key]
        for (const entity of entities) {
            const id = foreignKeys.
        }
        foreignKeys.
    }

    protected onEntitiesUpdated<K extends keyof E>(key: K, entities: E[K][]) {

    }

    protected onEntitiesDeleted<K extends keyof E>(key: K, ids: string[]) {

    }

    public on<K extends keyof Events<E, P>>(key: K, callback: (data: Events<E, P>[K]) => void) {
        this._emitter.on(key, callback)
    }

    public off<K extends keyof Events<E, P>>(key: K, callback: (data: Events<E, P>[K]) => void) {
        this._emitter.off(key, callback)
    }

    public emit<K extends keyof Events<E, P>>(key: K, data: Events<E, P>[K]) {
        this._emitter.emit(key, data)
    }

    protected update(...entries: UpdateEntry<E, P>[]) {
        const createdEntries: CompleteEntry<E, P>[] = []
        const updatedEntries: CompleteEntry<E, P>[] = []

        for (let { key, payload } of entries) {
            const id = JSON.stringify(key)

            const entities: Partial<E> = {}
            const old = this._entries.get(id)
            let complete = true;
            let wasComplete = this._completeEntries.has(id)

            // Knows the entry
            if (old) {
                // Setting previous values
                Object.assign(entities, old.entities)
                complete = this._completeEntries.has(id)
            } else {
                // Fetching init data from managers
                for (const name in key) {
                    let map = this._foreignKeys[name].get(key[name])
                    if (!map) {
                        map = new Map()
                    }

                    const manager = this.managers[name]
                    const entity = manager.entities.get(key[name])
                    
                    if (!entity) {
                        complete = false
                        continue;
                    }
                    
                    entities[name] = entity
                }
            }

            const entry: Entry<E, P> = {
                id,
                key,
                entities,
                payload
            }

            complete = complete && !!(payload || !this.hasPayload)

            if (complete)
                this._completeEntries.add(id);

            this._entries.set(id, entry);

            // Triggering
            if (complete) {
                updatedEntries.push(entry as CompleteEntry<E, P>)
                if (!wasComplete)
                    createdEntries.push(entry as CompleteEntry<E, P>)
            }
        }

        if (updatedEntries.length)
            this.emit('updated', updatedEntries)

        if (createdEntries.length)
            this.emit('created', createdEntries)
    }

    public dispose() {
        for (const key in this._listeners) {
            const listener = this._listeners[key]
            const manager = this.managers[key]
            manager.off('created', listener.created)
            manager.off('updated', listener.updated)
            manager.off('deleted', listener.deleted)
        }
        this._completeEntries.clear()
        this._entries.clear()
    }
}