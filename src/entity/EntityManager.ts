import Entity from "./Entity";
import Proxy from "../proxy/Proxy";
import { Observer } from "../proxy/IObservable";
import Observable from "../proxy/Observable";
import ProxyFilter from "../proxy/ProxyFilter";
import EventEmitter from "events";
import ManagerView from "../proxy/ManagerView";

type ViewQuery<T extends Entity> = {
    [K in keyof T]?: any | ((value: T[K]) => boolean);
}

interface Events<T> {
    created: T[];
    updated: T[];
    deleted: string[];
}

type EventListener<T> = (e: T) => void;
type EventKey<T> = string & keyof T;

export default class EntityManager<T extends Entity> {

    private _entities: Map<string, T>
    private _proxy: Proxy<T[]>
    private _views: Map<string, ManagerView<T>>
    private _emitter: EventEmitter;

    constructor() {
        this._entities = new Map()
        this._proxy = new Proxy<T[]>([])
        this._views = new Map()
        this._emitter = new EventEmitter()
    }

    public get entities(): Map<string, T> {
        return this._entities;
    }

    public observe(observer?: Observer<T[]>, trigger?: boolean): Observable<T[]> {
        const observable = new Observable(this._proxy)
        if (observer)
            observable.bind(observer, trigger)
        return observable
    }

    protected update(...entities: T[]) {
        if (entities.length === 0)
            return;

        const created = []
        const updated = []

        for (const entity of entities) {
            if (!this._entities.has(entity.id))
                created.push(entity)
            this._entities.set(entity.id, entity)
        }

        this._proxy.set([...this._entities.values()])

        if (created.length)
            this.emit('created', created)

        if (updated.length)
            this.emit('updated', entities)
    }

    protected delete(...ids: string[]) {
        const deleted = []
        for (const id of ids) {
            if (this._entities.has(id)) {
                this._entities.delete(id)
                deleted.push(id)
            }
        }

        if (deleted)
            this._proxy.set([...this._entities.values()])
    }

    public view(query: ViewQuery<T>): Observable<T[]> {

        const queryId = JSON.stringify(query)
        if (this._views.has(queryId)) {
            const view = this._views.get(queryId)!
            return new Observable(view)
        }

        const keys: {
            key: keyof T;
            value: any;
        }[] = []

        for (const key in query) {
            const value = query[key]
            if (value !== undefined)
                keys.push({ key, value })
        }

        const view = new ManagerView(this, (element: T) => {
            for (const { key, value } of keys) {
                if (value instanceof Function) {
                    const pass = value(element[key])
                    if (!pass)
                        return false;
                } else if (element[key] !== value)
                    return false
            }
            return true
        })

        this._views.set(queryId, view);

        return new Observable(view)
    }

    public on<K extends EventKey<Events<T>>>(key: K, listener: EventListener<Events<T>[K]>) {
        this._emitter.on(key, listener)
    }

    public off<K extends EventKey<Events<T>>>(key: K, listener: EventListener<Events<T>[K]>) {
        this._emitter.off(key, listener)
    }

    protected emit<K extends keyof Events<T>>(key: K, data: Events<T>[K]) {
        this._emitter.emit(key, data)
    }
}