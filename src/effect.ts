import { ACTIONS, BATCH_SIGNALS } from "./consts/effect";
import { noop } from "./shared";

interface IValue<T> {
  value: T[keyof T];
}

interface IOldValue<T> {
  oldValue: T[keyof T];
}

export interface IEffectFn<T> {
  (value: IValue<T>["value"], oldValue: IOldValue<T>["oldValue"]): void;
}

export interface TTriggerOptions<T = object> extends IValue<T>, IOldValue<T> {
  type: (typeof ACTIONS)[keyof typeof ACTIONS];
}

export type TTrackHandler = (target: object, property: string) => void;

type TBatchEffects = {
  current: Set<() => void>;
  status: `${BATCH_SIGNALS}`;
};

type TActiveEffect = {
  current?: () => void;
};

export const activeChannelMap = new WeakMap();
export const weakListProxiesMap = new WeakMap();

export const activeEffect: TActiveEffect = {
  current: noop(),
};

export const batchEffects: TBatchEffects = {
  current: new Set(),
  status: BATCH_SIGNALS.EMPTY,
};

export function trigger<T extends object>(
  target: T,
  key: keyof T | null,
  options: TTriggerOptions<T>
) {
  const depsMap = activeChannelMap.get(target);

  if (!depsMap) return;
  const dep = depsMap.get(key);

  if (!dep) return;

  const effects = Array.from<IEffectFn<T>>(dep);

  for (const effect of effects) {
    if (batchEffects.status === BATCH_SIGNALS.WAIT) {
      batchEffects.current.add(effect as () => void);
    } else {
      effect(options.value, options.oldValue);
    }
  }
}

function getValidDependencyMap<T extends object>(
  activeChannelMap: WeakMap<T, Map<keyof T, unknown>>,
  target: T
) {
  const depsMap = activeChannelMap.get(target);
  if (depsMap) return depsMap;

  const newMap = new Map();
  activeChannelMap.set(target, newMap);

  return newMap;
}

function getValidDeepSet<T = string, K = keyof T>(
  depsMap: Map<K, Set<T>>,
  key: K
) {
  const deepSet = depsMap.get(key);
  if (deepSet) return deepSet;

  const newSet = new Set<T>();
  depsMap.set(key, newSet);

  return newSet;
}

export function track<T extends object, K = keyof T>(target: T, key: K) {
  if (activeEffect.current) return;

  const depsMap = getValidDependencyMap<T>(activeChannelMap, target);
  const dep = getValidDeepSet<T>(depsMap, key as never);

  if (!!activeEffect.current) dep.add(activeEffect.current as unknown as T);

  return dep;
}
