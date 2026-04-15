import { AppEventsInterface, EventRegister } from './event.types';
import { registerEvents } from './events.register';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (data: any) => any;

export class AppEventManager {
    private handlers: Map<keyof AppEventsInterface, EventHandler[]> = new Map();

    constructor(registerFn: (bus: AppEventManager) => void) {
        registerFn(this);
        this.dispatch('event:registration:successful');
    }

    public async dispatch<K extends keyof AppEventsInterface>(
        eventName: K,
        ...args: AppEventsInterface[K]['data'] extends void ? [] : [AppEventsInterface[K]['data']]
    ): Promise<AppEventsInterface[K]['return'][]> {
        const handlers = this.handlers.get(eventName) || [];

        if (handlers.length === 0) {
            return [];
        }

        const data = args[0] as EventRegister[K];
        const results: AppEventsInterface[K]['return'][] = [];

        for (const handler of handlers) {
            try {
                const result = await handler(data);
                if (result !== undefined) {
                    results.push(result);
                }
            } catch (error) {
                console.error(`Error in handler for event '${String(eventName)}':`, error);
                throw error;
            }
        }

        return results;
    }

    public onEvent<K extends keyof AppEventsInterface>(
        eventName: K,
        handler: (data: EventRegister[K]) => Promise<AppEventsInterface[K]['return']> | AppEventsInterface[K]['return'],
    ) {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, []);
        }
        this.handlers.get(eventName)!.push(handler as EventHandler);

        return () => {
            const handlers = this.handlers.get(eventName);
            if (handlers) {
                const index = handlers.indexOf(handler as EventHandler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        };
    }
}

export const eventBus = new AppEventManager(registerEvents);
export const dispatch = eventBus.dispatch.bind(eventBus);
