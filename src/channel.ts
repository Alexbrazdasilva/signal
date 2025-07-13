import { BATCH_SIGNALS, COMPUTED, RAW, SIGNAL_PREFIX } from "./consts/effect";
import { activeEffect, batchEffects, IEffectFn, track } from "./effect";
import { createGetterProxy, createProxy, createSourceObject } from "./handlers";

export function $channel<T extends Record<string, unknown>>(state: T): T {
  return createProxy(state);
}

export function $signal<T = unknown>(state: T): { value: T } {
  const signal = createSourceObject(state, SIGNAL_PREFIX);

  return createProxy(signal);
}

export function $noise<T = string | number | boolean | object>(state: T) {
  const noise = createSourceObject(state, SIGNAL_PREFIX);

  return createProxy(noise, true);
}

export function $readOnly<T = string | number | boolean | object>(state: T) {
  const readonly = createSourceObject(state, SIGNAL_PREFIX);
  return createProxy(readonly, false, true);
}

export function $on<T>($channel = {}, callBack: IEffectFn<T>) {
  const target = Reflect.get($channel, RAW);
  const deps = track(target, SIGNAL_PREFIX);

  deps?.add(callBack);
}

export function $effect(fn: () => void) {
  if (!activeEffect.current) {
    activeEffect.current = fn;
    fn();
    activeEffect.current = undefined;
  }
}

export function $batch(fn: () => void) {
  const isNested = batchEffects.status === BATCH_SIGNALS.WAIT;
  if (!isNested) batchEffects.status = BATCH_SIGNALS.WAIT;

  try {
    fn();
  } finally {
    if (!isNested) {
      batchEffects.status = BATCH_SIGNALS.DONE;

      for (const effect of batchEffects.current.values()) effect();

      batchEffects.current.clear();
      batchEffects.status = BATCH_SIGNALS.EMPTY;
    }
  }
}

export function $when(test: () => boolean, fn: () => void) {
  const results = {
    last: false,
    current: false,
  };

  $effect(() => {
    results.current = test();

    if (results.current && !results.last) fn();

    results.last = results.current;
  });
}

export function $derived<T extends unknown>(fn: (oldValue: T) => T) {
  let oldValue: T = null as T;
  const derivedValue = createGetterProxy<T>(null as T);

  $effect(() => {
    const nextValue = fn(oldValue);
    if (oldValue !== nextValue) {
      oldValue = nextValue;
      Reflect.set(derivedValue, COMPUTED, nextValue);
    }
  });

  return derivedValue;
}
