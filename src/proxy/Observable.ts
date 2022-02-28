import IObservable, { Listenable, Observer } from "./IObservable";

export default class Observable<T> implements IObservable<T> {

    protected _observers: Set<Observer<T>>;
    protected _listenable: Listenable<T>;

    public get value(): T {
        return this._listenable.value;
    }

    constructor(listenable: Listenable<T>) {
        this._observers = new Set()
        this._listenable = listenable;
    }

    public bind(observer: Observer<T>, trigger = true) {
        this._observers.add(observer)
        this._listenable.bind(observer, trigger)
    }

    public unbind(observer: Observer<T>) {
        if (this._observers.has(observer))
            this._observers.delete(observer)
    }

    public dispose() {
        for (const observer of this._observers)
            this._listenable.unbind(observer)
    }
}