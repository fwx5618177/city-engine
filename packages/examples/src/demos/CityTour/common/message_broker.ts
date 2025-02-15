import { VehicleView } from './flythrough/vehicle_view';

type MessageData = {
  'flythrough.started': {
    vehicleView: VehicleView;
  };
  'flythrough.stopped': Record<string, never>;
  'touch.focus': Record<string, never>;
  [key: string]: unknown;
};

interface Subscriber<T = unknown> {
  id: number;
  func: (data: T) => void;
}

type Subscribers = {
  [topic: string]: Array<Subscriber<unknown>>;
};

export class MessageBroker {
  private uniqueID: number;
  private subscribers: Subscribers;

  constructor() {
    this.uniqueID = -1;
    this.subscribers = {};
  }

  addSubscriber<K extends keyof MessageData>(
    topic: K,
    func: (data: MessageData[K]) => void,
  ): number {
    if (this.subscribers[topic] === undefined) {
      this.subscribers[topic] = [];
    }

    this.uniqueID += 1;

    const subscriber = { id: this.uniqueID, func };
    this.subscribers[topic].push(subscriber);
    return this.uniqueID;
  }

  removeSubscriber(topic: keyof MessageData, id: number): boolean {
    const subscribersForTopic = this.subscribers[topic];

    if (subscribersForTopic !== undefined) {
      for (let i = 0; i < subscribersForTopic.length; i++) {
        if (subscribersForTopic[i].id === id) {
          subscribersForTopic.splice(i, 1);
          return true;
        }
      }
    }

    return false;
  }

  publish<K extends keyof MessageData>(topic: K, data: MessageData[K]): void {
    if (
      this.subscribers[topic] === undefined ||
      this.subscribers[topic].length === 0
    ) {
      console.warn(`Warning: No listeners for topic ${topic}`);
    } else {
      this.subscribers[topic].forEach((entry) => {
        entry.func(data);
      });
    }
  }
}

export type { MessageData, Subscriber, Subscribers };
