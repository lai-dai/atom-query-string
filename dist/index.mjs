// src/atom-query-string.ts
import { atom } from "jotai";
import { RESET } from "jotai/utils";
function isNumber(num) {
  if (typeof num === "number") {
    return num - num === 0;
  }
  if (typeof num === "string" && num.trim() !== "") {
    return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
  }
  return false;
}
function toNumberable(value) {
  if (Array.isArray(value)) {
    return value.map((item) => toNumberable(item));
  }
  switch (typeof value) {
    case "string":
      return isNumber(value) ? Number(value) : value;
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
      const url = new URL(window.location.href);
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
      console.log("newValue", newValue);
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
  queryString = defaultQueryString
  // getOnInit,
} = {}) {
  const anAtom = atom(
    initialValue,
    (get, set, update, isPushState = true) => {
      const nextValue = update === RESET ? initialValue : update instanceof Function ? update(get(anAtom)) : update;
      set(anAtom, nextValue);
      onValueChange?.(nextValue);
      if (isPushState) {
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
//# sourceMappingURL=index.mjs.map