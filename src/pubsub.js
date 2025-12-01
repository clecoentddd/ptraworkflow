// Simple Pub/Sub library for event-driven communication
// Usage:
//   import pubsub from './pubsub';
//   pubsub.subscribe('topic', handler)
//   pubsub.publish('topic', data)
//   pubsub.unsubscribe('topic', handler)

const subscribers = {};

const pubsub = {
  subscribe(topic, handler) {
    if (!subscribers[topic]) {
      subscribers[topic] = new Set();
    }
    subscribers[topic].add(handler);
    return () => pubsub.unsubscribe(topic, handler);
  },

  unsubscribe(topic, handler) {
    if (subscribers[topic]) {
      subscribers[topic].delete(handler);
      if (subscribers[topic].size === 0) {
        delete subscribers[topic];
      }
    }
  },

  publish(topic, data) {
    if (subscribers[topic]) {
      for (const handler of subscribers[topic]) {
        try {
          handler(data);
        } catch (err) {
          // Optionally log or handle errors
          console.error('PubSub handler error:', err);
        }
      }
    }
  },

  clear() {
    Object.keys(subscribers).forEach(topic => delete subscribers[topic]);
  }
};

export default pubsub;
