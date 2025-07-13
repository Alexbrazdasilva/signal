import {
  ACTIONS,
  COMPUTED,
  PROXY,
  RAW,
  READONLY,
  SHALLOW,
  SIGNAL_PREFIX,
} from "./consts/effect";
import { ARRAY_LIKE, DEEP_TYPES } from "./consts/types";
import { track, trigger, weakListProxiesMap } from "./effect";
import { duckTypeExtract, isProxy, isSignal } from "./shared/types";

export function createSourceObject<K extends string, T = unknown>(
  value: T,
  prefix: K
): Record<K, T> {
  const source = Object.create({ [prefix]: value });

  return source;
}

export function createGetterHandler(
  trackHandler: typeof track,
  isProxyGetter: boolean,
  isShallow?: boolean,
  isReadonly?: boolean
) {
  function get<T extends object, K = keyof T>(
    target: T,
    property: K,
    receiver?: T
  ) {
    if (property === RAW) return target;
    if (property === PROXY) return isProxyGetter;
    if (property === READONLY) return isReadonly;
    if (property === SHALLOW) return isShallow;

    const value = Reflect.get<T, string>(
      target,
      property as string,
      isProxy(target) ? target : receiver
    );

    if (!isReadonly) trackHandler(target, property);
    if (isShallow) return value;

    if (DEEP_TYPES.includes(duckTypeExtract(value))) {
      return createProxy(
        value as Record<string, unknown> | Array<T[keyof T]>,
        false,
        isReadonly
      );
    }

    return value;
  }

  return get;
}

export function createSetterHandler<T extends Record<string, unknown>>(
  triggerHandler: typeof trigger
) {
  function set(target: T, property: keyof T, value: unknown, receiver: object) {
    if (property === RAW) return false;

    const oldValue = Reflect.get(target, property, receiver);
    const result = Reflect.set(
      target,
      property,
      value,
      isProxy(target) ? target : receiver
    );

    const newValue = Reflect.get(target, property, receiver);

    triggerHandler(target, property, {
      value: newValue,
      oldValue,
      type: ACTIONS.SET,
    });

    return result;
  }

  return set;
}

export function createSetterReadonlyHandler(
  triggerHandler: typeof trigger,
  isGetter: boolean
) {
  function set<T extends Record<string, unknown>>(
    target: T,
    property: keyof T,
    value: T[keyof T],
    receiver: T
  ) {
    if (property === COMPUTED && isGetter) {
      const set = createSetterHandler(triggerHandler);
      return set(target, SIGNAL_PREFIX, value, receiver);
    }

    console.warn(`[🔥 signal] - "${property as string}" is readonly`);
    return false;
  }

  return set;
}

export function createHandlerProxy(
  isReadonly = false,
  isProxy = true,
  isGetter = false,
  isShallow = false
) {
  const get = isShallow
    ? createGetterHandler(track, isProxy, isShallow, isReadonly)
    : createGetterHandler(track, isProxy, false, isReadonly);

  const set = isReadonly
    ? createSetterReadonlyHandler(trigger, isGetter)
    : createSetterHandler(trigger);

  return {
    get,
    set,
    __isReadonly__: isReadonly,
    __isShallow__: isShallow,
  };
}

export function createProxy<T extends Record<string, unknown> | Array<unknown>>(
  state: T,
  shallow = false,
  readonly = false
): T {
  const existsChannel = weakListProxiesMap.has(state);

  if (isProxy(state)) return state as unknown as T;
  if (existsChannel) return weakListProxiesMap.get(state) as T;

  const handlerProxy = createHandlerProxy(readonly, true, false, shallow);
  const proxy = new Proxy(state, handlerProxy) as T;

  weakListProxiesMap.set(state, proxy);

  return proxy;
}

export function createGetterProxy<T = unknown>(
  initialValue: T
): Readonly<{ value: T }> {
  const handler = createHandlerProxy(true, false, true, true);
  const getter = createSourceObject(
    initialValue,
    COMPUTED
  ) as unknown as Record<typeof SIGNAL_PREFIX, T>;

  return new Proxy<typeof getter>(getter, handler);
}
