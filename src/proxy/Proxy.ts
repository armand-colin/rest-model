import { Observer } from "./IObservable";

export default class Proxy<T> {

    private _value: T;
    private _listeners: Set<Observer<T>>

    public get value(): T { return this._value }
    
    constructor(value: T) {
        this._value = value;
        this._listeners = new Set()
    }

    public set(value: T) {
        const old = this._value;
        this._value = value
        for (const listener of this._listeners)
            listener(value, old)
    }

    public bind(listener: Observer<T>, trigger = true) {
        this._listeners.add(listener)
        if (trigger)
            listener(this._value)
    }  

    public unbind(listener: Observer<T>) {
        if (this._listeners.has(listener))
            this._listeners.delete(listener)
    }
}