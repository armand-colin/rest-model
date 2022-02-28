import { Entity, EntityManager } from "..";
import IObservable, { Observer } from "./IObservable";

export default class ManagerView<T extends Entity> implements IObservable<T[]> {

    private _manager: EntityManager<T>
    private _entities: Map<string, T>
    private _filter: (element: T) => boolean;
    private _observers: Set<Observer<T[]>>

    constructor(manager: EntityManager<T>, filter: (element: T) => boolean) {
        this._manager = manager;
        this._entities = new Map()
        this._filter = filter;
        this._observers = new Set()

        this._manager.on('updated', this.onUpdated)
        this._manager.on('deleted', this.onDeleted)

        this.onCreated([...this._manager.entities.values()])
    }

    public get value(): T[] {
        return [...this._entities.values()]
    }

    bind(observer: Observer<T[]>, trigger = true): void {
        this._observers.add(observer)
        if (trigger)
            observer(this.value)
    }

    unbind(observer: Observer<T[]>): void {
        if (this._observers.has(observer))
            this._observers.delete(observer)
    }

    dispose(): void {
        this._observers.clear()

        this._manager.off('updated', this.onUpdated)
        this._manager.off('deleted', this.onDeleted)
    }

    private onCreated = (elements: T[]) => {
        const accepted = elements.filter(this._filter)
        
        for (const entity of accepted)
            this._entities.set(entity.id, entity)
    }

    private onUpdated = (elements: T[]) => {
        let change = false
        const old = this.value

        for (const entity of elements) {
            const accepted = this._filter(entity)

            if (accepted && !this._entities.has(entity.id)) {
                this._entities.set(entity.id, entity)
                change = true;
            } else if (!accepted && this._entities.has(entity.id)) {
                this._entities.delete(entity.id)
                change = false;
            }
        }
        if (!change)
            return;
        
        const value = this.value

        for (const observer of this._observers)
            observer(value, old)
    }

    private onDeleted = (ids: string[]) => {
        let change = false;
        const old = this.value;

        for (const id of ids) {
            if (!this._entities.has(id))
                continue;

            this._entities.delete(id)
            change = true;
        }

        if (!change)
            return;

        const value = this.value;

        for (const observer of this._observers)
            observer(value, old)
    }
}