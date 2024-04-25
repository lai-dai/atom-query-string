import { atom } from "jotai";
import type { WritableAtom } from "jotai";
import { RESET } from "jotai/utils";

type Unsubscribe = () => void;

type SetStateActionWithReset<Value> =
  | Value
  | typeof RESET
  | ((prev: Value) => Value);

type WithInitialValue<Value> = {
  init: Value;
};

export interface QueryString<Value> {
  parse: (str: string, initialValue: Value) => Value;
  stringify: (obj: Value) => string;
  get: (initialValue: Value) => Value;
  subscribe?: (
    callback: (value: Value) => void,
    initialValue: Value,
  ) => Unsubscribe;
}

export interface AtomWithQueryStringOptions<Value> {
  onValueChange?: (value: Value) => void;
  onPathnameChange?: (pathname: string) => void;
  queryString?: QueryString<Value>;
  getOnInit?: boolean;
}

function isNumber(num: any) {
  if (typeof num === "number") {
    return num - num === 0;
  }
  if (typeof num === "string" && num.trim() !== "") {
    return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
  }
  return false;
}

function toNumberable(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item: any) => toNumberable(item));
  }
  switch (typeof value) {
    case "string":
      return isNumber(value) ? Number(value) : value;

    default:
      return value;
  }
}

function createQueryString<Value>(): QueryString<Value> {
  const queryString: QueryString<Value> = {
    parse: (str, initialValue) => {
      const output: Record<string, any> = {};
      const urlParams = new URLSearchParams(str);

      // Set will return only unique keys()
      new Set([...urlParams.keys()]).forEach((key) => {
        output[key] =
          urlParams.getAll(key).length > 1
            ? urlParams.getAll(key)
            : initialValue instanceof Object &&
                key in initialValue &&
                typeof initialValue[key as keyof typeof initialValue] ===
                  "number"
              ? toNumberable(urlParams.get(key))
              : urlParams.get(key);
      });

      return output as Value;
    },
    stringify: (obj) => {
      const output = Object.entries(obj as Record<string, any>)
        .flatMap(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map((item) => {
              if (item == undefined || item == null) return;
              return encodeURIComponent(key) + "=" + encodeURIComponent(item);
            });
          }
          if (value == undefined || value == null) return;
          return encodeURIComponent(key) + "=" + encodeURIComponent(value);
        })
        .join("&");
      return output;
    },
    get: (initialValue) => {
      const url = new URL(window.location.href);

      for (const k of url.searchParams.keys()) {
        if (!(k in (initialValue as Record<string, any>))) {
          url.searchParams.delete(k);
        }
      }
      const urlParsed = queryString.parse(
        url.searchParams.toString(),
        initialValue,
      );
      const newValue = Object.assign({}, initialValue, urlParsed);

      return newValue;
    },
  };
  if (
    typeof window !== "undefined" &&
    typeof window.addEventListener === "function"
  ) {
    queryString.subscribe = (callback, initialValue) => {
      const popstateEventCallback = (e: PopStateEvent) => {
        callback(queryString.get(initialValue));
      };
      window.addEventListener("popstate", popstateEventCallback);
      return () => {
        window.removeEventListener("popstate", popstateEventCallback);
      };
    };
  }
  return queryString;
}

const defaultQueryString = createQueryString();

export function atomWithQueryString<Value extends object>(
  initialValue: Value,
  {
    onValueChange,
    onPathnameChange,
    queryString = defaultQueryString as QueryString<Value>,
    getOnInit,
  }: AtomWithQueryStringOptions<Value> = {},
): WritableAtom<Value, [SetStateActionWithReset<Value>], void> &
  WithInitialValue<Value> {
  type Update = SetStateActionWithReset<Value>;
  const baseAtom = atom<Value>(
    getOnInit ? queryString.get(initialValue) : initialValue,
  );

  baseAtom.onMount = (setAtom) => {
    setAtom(queryString.get(initialValue));
    let unsub: Unsubscribe | undefined;
    if (queryString.subscribe) {
      unsub = queryString.subscribe(setAtom, initialValue);
    }
    return unsub;
  };

  const anAtom = atom<Value, [Update], void>(
    (get) => get(baseAtom),
    (get, set, update, isPushState: boolean = true) => {
      const nextValue =
        update === RESET
          ? initialValue
          : update instanceof Function
            ? update(get(baseAtom))
            : update;

      set(baseAtom, nextValue);
      onValueChange?.(nextValue);

      if (isPushState) {
        const url = new URL(window.location.href);
        const parsed = queryString.parse(
          url.searchParams.toString(),
          initialValue,
        );
        const searchParams = queryString.stringify(
          Object.assign(parsed, nextValue),
        );

        const resultUrl =
          update === RESET ? url.pathname : url.pathname + "?" + searchParams;

        if (onPathnameChange instanceof Function) {
          onPathnameChange(resultUrl);
        } else {
          window.history.pushState(null, "", resultUrl);
        }
      }
    },
  );
  Object.assign(anAtom, { init: initialValue });

  return anAtom as WritableAtom<Value, [Update], void> &
    WithInitialValue<Value>;
}
