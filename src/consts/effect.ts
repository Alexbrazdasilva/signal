export const RAW = "__raw__";
export const PROXY = "__isProxy__";
export const READONLY = "__isReadonly__";
export const SHALLOW = "__isShallow__";

export const COMPUTED = "__isComputedGetter__";

export const SIGNAL_PREFIX = "value";

export const ACTIONS = {
  SET: "__set__",
  GET: "__get__",
  REMOVE: "__remove__",
};

export enum BATCH_SIGNALS {
  EMPTY = "__empty__",
  WAIT = "__wait__",
  DONE = "__done__",
}
