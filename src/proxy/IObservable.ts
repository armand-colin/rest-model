export type Observer<T> = (value: T, old?: T) => void;

export interface Listenable<T> {
    value: T;
    bind(observer: Observer<T>, trigger?: boolean): void;
    unbind(observer: Observer<T>): void;
}

export default interface IObservable<T> extends Listenable<T> {
    dispose(): void;
}