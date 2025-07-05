let keyIndex = 0;
const PREFIX = '__ch__';
const weakKeys = new Set();
const listeners = new WeakMap();

// TODO: Ajustar isso
function subscribe(id, fn) {
  if (!listeners.has(id)) {
    listeners.set(id, new Set());
  }

  listeners.get(id).add(fn);
}

function notify(id, value, oldValue) {
  if (!listeners.has(id)) return;

  const allListeners = listeners.get(id);
  allListeners.forEach((fn) => fn && fn(value, oldValue));
}

export function channel(state) {
  const key = Symbol(PREFIX + keyIndex);

  const objectChannel = new Proxy(state, {
    get(target, property, receiver) {
      if (property === PREFIX) return key;

      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property === PREFIX) return false;

      const oldValue = Reflect.get(target, property, receiver);
      Reflect.set(target, property, value, receiver);
      const newValue = Reflect.get(target, property, receiver);

      notify(key, newValue, oldValue);

      if (typeof newValue === 'object') channel(newValue);
      return true;
    },
  });

  weakKeys.add(key);
  keyIndex++;

  return objectChannel;
}

export function $signal(state) {
  return channel({ value: state });
}

export function $on($channel = {}, callBack) {
  const key = Reflect.get($channel, PREFIX);

  subscribe(key, callBack);
}
