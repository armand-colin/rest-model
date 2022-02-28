import IObservable, { Listenable, Observer } from "./IObservable";

export default class ProxyFilter<T> implements IObservable<T[]> {
    
    private _filter: (element: T) => boolean;
    private _value: T[];
    private _listenable: Listenable<T[]>
    private _observers: Set<Observer<T[]>>

    constructor(listenable: Listenable<T[]>, filter: (element: T) => boolean) {
        this._filter = filter;
        this._value = []
        this._listenable = listenable
        this._observers = new Set()
        listenable.bind(this.onChange, true);
    }

    public get value(): T[] {
        return this._value;
    }

    public bind(observer: Observer<T[]>, trigger?: boolean): void {
        this._observers.add(observer)
        if (trigger)
            observer(this._value)
    }

    public unbind(observer: Observer<T[]>): void {
        if (this._observers.has(observer))
            this._observers.delete(observer)
    }

    public dispose(): void {
        this._listenable.unbind(this.onChange)
        this._observers.clear()
    }

    private onChange = (elements: T[]) => {        
        const old = this._value;
        this._value = elements.filter(this._filter)

        for (const observer of this._observers)
            observer(this._value, old)
    }
}