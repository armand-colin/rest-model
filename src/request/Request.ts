interface RequestDefinition {
    body?: any;
    url?: any;
    headers?: any;
    result: any;
    error: {
        code: number;
        body: any;
    };
}

type ExcludeKeys<T, U> = T extends U ? never : T;

type Override<T extends Partial<RequestDefinition>> = {
    [K in keyof T]-?: T[K]
} & {
    [K in ExcludeKeys<keyof RequestDefinition, keyof T>]?: RequestDefinition[K]
}

type ResultPromise<E, R> = Promise<[E, null] | [null, R]>

export default class Request<T extends Partial<RequestDefinition>> {

    public static urlPrefix: string = "";

    constructor(private method: string, private url: string, private successCode: number) { }

    private injectUrlParameters(urlParams: any): string {
        const split = this.url.split('/')
        const url = split.map(item => {
            if (item.startsWith(':')) {
                const key = item.slice(1)
                if (!urlParams || urlParams[key] === undefined)
                    throw new Error(`Missing url parameter ${key} for request`);
                return urlParams[key]
            }
            return item;
        }).join('/')
        return Request.urlPrefix + url
    }

    public call(params: Pick<Override<T>, 'body' | 'headers' | 'url'>): ResultPromise<Override<T>['error'], Override<T>['result']> {
        const url = this.injectUrlParameters(params.url)
        
        const headers = new Headers()
        
        headers.set('Content-Type', 'application/json')

        if (params.headers) 
            for (const key in params.headers)
                headers.set(key, params.headers[key])
        
        return new Promise((resolve, reject) => {
            console.log('body', this.method !== 'get' ? params.body : undefined);
            
            fetch(url, {
                method: this.method,
                body: this.method !== 'get' ? JSON.stringify(params.body) : undefined,
                headers
            }).then(async response => {
                const body = await response.json()
                if (response.status === this.successCode)
                    resolve([null, body])
                else
                    resolve([{ code: response.status, body }, null])
            })
        })
    }
}