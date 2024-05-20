// src/atom-query-string.ts
import { atom } from "jotai";
import { RESET } from "jotai/utils";
function toNumberable(value) {
  if (Array.isArray(value)) {
    return value.map((item) => toNumberable(item));
  }
  switch (typeof value) {
    case "string":
      return (Number.isFinite ? Number.isFinite(+value) : isFinite(+value)) ? Number(value) : value;
    default:
      return value;
  }
}
function createQueryString() {
  const queryString = {
    parse: (str, initialValue) => {
      const output = {};
      const urlParams = new URLSearchParams(str);
      (/* @__PURE__ */ new Set([...urlParams.keys()])).forEach((key) => {
        output[key] = urlParams.getAll(key).length > 1 ? urlParams.getAll(key) : initialValue instanceof Object && key in initialValue && typeof initialValue[key] === "number" ? toNumberable(urlParams.get(key)) : urlParams.get(key);
      });
      return output;
    },
    stringify: (obj) => {
      const output = Object.entries(obj).flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((item) => {
            if (item == void 0 || item == null)
              return;
            return encodeURIComponent(key) + "=" + encodeURIComponent(item);
          });
        }
        if (value == void 0 || value == null)
          return;
        return encodeURIComponent(key) + "=" + encodeURIComponent(value);
      }).join("&");
      return output;
    },
    get: (initialValue) => {
      const url = new URL(
        typeof window !== "undefined" ? window.location.href : ""
      );
      for (const k of url.searchParams.keys()) {
        if (!(k in initialValue)) {
          url.searchParams.delete(k);
        }
      }
      const urlParsed = queryString.parse(
        url.searchParams.toString(),
        initialValue
      );
      const newValue = Object.assign({}, initialValue, urlParsed);
      return newValue;
    }
  };
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    queryString.subscribe = (callback, initialValue) => {
      const popstateEventCallback = (e) => {
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
var defaultQueryString = createQueryString();
function atomWithQueryString(initialValue, {
  onValueChange,
  onPathnameChange,
  queryString = defaultQueryString,
  getOnInit
} = {}) {
  const baseAtom = atom(
    getOnInit ? queryString.get(initialValue) : initialValue
  );
  const anAtom = atom(
    (get) => get(baseAtom),
    (get, set, update, isPushState = true) => {
      const nextValue = update === RESET ? initialValue : update instanceof Function ? update(get(baseAtom)) : update;
      set(baseAtom, nextValue);
      onValueChange?.(nextValue);
      if (isPushState && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const parsed = queryString.parse(
          url.searchParams.toString(),
          initialValue
        );
        const searchParams = queryString.stringify(
          Object.assign(parsed, nextValue)
        );
        const resultUrl = update === RESET ? url.pathname : url.pathname + "?" + searchParams;
        if (onPathnameChange instanceof Function) {
          onPathnameChange(resultUrl);
        } else {
          window.history.pushState(null, "", resultUrl);
        }
      }
    }
  );
  anAtom.onMount = (setAtom) => {
    if (!getOnInit)
      setAtom(queryString.get(initialValue), false);
    let unsub;
    if (queryString.subscribe) {
      unsub = queryString.subscribe(setAtom, initialValue);
    }
    return unsub;
  };
  return anAtom;
}
export {
  atomWithQueryString
};
//# sourceMappingURL=atom-query-string.mjs.map