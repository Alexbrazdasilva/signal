import {
  COMPUTED,
  PROXY,
  READONLY,
  SHALLOW,
  SIGNAL_PREFIX,
} from "../consts/effect";

export function duckTypeExtract(type: unknown) {
  const rawType = Object.prototype.toString.call(type);

  return rawType
    .substring(7, rawType.length - 1)
    .toLowerCase()
    .trim();
}

export function isObject(source: unknown): boolean {
  return duckTypeExtract(source) === "object";
}

export function isProxy(source = {}): boolean {
  return source ? Reflect.get(source, PROXY) : false;
}

export function isReadonly(source = {}): boolean {
  return source ? Reflect.get(source, READONLY) : false;
}

export function isShallow(source = {}): boolean {
  return source ? Reflect.get(source, SHALLOW) : false;
}

export function isComputedGetter(source = {}): boolean {
  return source ? Reflect.get(source, COMPUTED) : false;
}

export function isSignal(source = {}): boolean {
  return source ? Reflect.has(source, SIGNAL_PREFIX) : false;
}
