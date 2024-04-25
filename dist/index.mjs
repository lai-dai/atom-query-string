// src/atom-query-string.ts
import { atom } from "jotai";
import { RESET, atomWithReset } from "jotai/utils";
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
function parseQueryString(searchParams, initialValue) {
  const output = {};
  const urlParams = new URLSearchParams(searchParams);
  (/* @__PURE__ */ new Set([...urlParams.keys()])).forEach((key) => {
    output[key] = urlParams.getAll(key).length > 1 ? urlParams.getAll(key) : initialValue instanceof Object && key in initialValue && typeof initialValue[key] === "number" ? toNumberable(urlParams.get(key)) : urlParams.get(key);
  });
  return output;
}
function stringifyQueryString(obj) {
  return Object.entries(obj).flatMap(([key, value]) => {
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
}
function createQueryString(initialValue) {
  return {
    parse: (searchParams) => parseQueryString(searchParams, initialValue),
    stringify: stringifyQueryString
  };
}
var atomWithQueryString = (initialValue, {
  onValueChange,
  onPathnameChange,
  queryString = createQueryString(initialValue),
  isSyncPathname = true
} = {}) => {
  const baseAtom = atomWithReset(initialValue);
  const anAtom = atom(
    (get) => get(baseAtom),
    (get, set, update) => {
      const newValue = update === RESET ? initialValue : update instanceof Function ? update(get(baseAtom)) : update;
      set(baseAtom, newValue);
      onValueChange?.(newValue);
      const url = new URL(window.location.href);
      const parsed = queryString.parse(url.searchParams.toString());
      const searchParams = queryString.stringify(
        Object.assign(parsed, newValue)
      );
      const resultUrl = update === RESET ? url.pathname : url.pathname + "?" + searchParams;
      if (onPathnameChange instanceof Function) {
        onPathnameChange(resultUrl);
      } else {
        window.history.pushState(null, "", resultUrl);
      }
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
export {
  atomWithQueryString
};
//# sourceMappingURL=index.mjs.map