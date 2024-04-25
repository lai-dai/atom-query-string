import { atom } from "jotai";
import { RESET, atomWithReset } from "jotai/utils";

type SetStateAction<S> = S | ((prevState: S) => S);

export interface QueryString {
  parse: (str: string) => Record<string, any>;
  stringify: (obj: Record<string, any>) => string;
}

export interface AtomWithQueryStringOptions<Value> {
  onValueChange?: (value: Value) => void;
  onPathnameChange?: (pathname: string) => void;
  queryString?: QueryString;
  isSyncPathname?: boolean;
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

function parseQueryString(searchParams: string) {
  const output: Record<string, any> = {};
  const urlParams = new URLSearchParams(searchParams);

  // Set will return only unique keys()
  new Set([...urlParams.keys()]).forEach((key) => {
    output[key] =
      urlParams.getAll(key).length > 1
        ? toNumberable(urlParams.getAll(key))
        : toNumberable(urlParams.get(key));
  });

  return output;
}

function stringifyQueryString(obj: Record<string, any>) {
  return Object.entries(obj)
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
}

function createQueryString(): QueryString {
  return {
    parse: parseQueryString,
    stringify: stringifyQueryString,
  };
}

export const atomWithQueryString = <Value extends object>(
  initialValue: Readonly<Value>,
  {
    onValueChange,
    onPathnameChange,
    queryString = createQueryString(),
    isSyncPathname = true,
  }: AtomWithQueryStringOptions<Value> = {}
) => {
  const baseAtom = atomWithReset<Value>(initialValue);

  const anAtom = atom(
    (get) => get(baseAtom),
    (get, set, update: SetStateAction<Value> | typeof RESET) => {
      const newValue =
        update === RESET
          ? initialValue
          : update instanceof Function
          ? update(get(baseAtom))
          : update;

      set(baseAtom, newValue);
      onValueChange?.(newValue);

      const url = new URL(window.location.href);
      const parsed = queryString.parse(url.searchParams.toString());
      const searchParams = queryString.stringify(
        Object.assign(parsed, newValue)
      );

      const resultUrl =
        update === RESET ? url.pathname : url.pathname + "?" + searchParams;

      window.history.pushState(null, "", resultUrl);

      onPathnameChange?.(resultUrl);
    }
  );

  anAtom.onMount = (setAtom) => {
    const handlePopState = () => {
      if (isSyncPathname) {
        const url = new URL(window.location.href);

        for (const k of url.searchParams.keys()) {
          if (!(k in initialValue)) {
            url.searchParams.delete(k);
          }
        }
        const parsed = queryString.parse(url.searchParams.toString());

        const value = Object.assign({}, initialValue, parsed);

        setAtom(value);
      }
    };
    handlePopState();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  };

  return anAtom;
};
