"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  atomWithQueryString: () => atomWithQueryString
});
module.exports = __toCommonJS(src_exports);

// src/atom-query-string.ts
var import_jotai = require("jotai");
var import_utils = require("jotai/utils");
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
  getOnInit
} = {}) => {
  const getValueWithQueryString = (initialValue2) => {
    const url = new URL(window.location.href);
    for (const k of url.searchParams.keys()) {
      if (!(k in initialValue2)) {
        url.searchParams.delete(k);
      }
    }
    const parsed = queryString.parse(url.searchParams.toString());
    return Object.assign({}, initialValue2, parsed);
  };
  const baseAtom = (0, import_utils.atomWithReset)(
    getOnInit ? getValueWithQueryString(initialValue) : initialValue
  );
  const anAtom = (0, import_jotai.atom)(
    (get) => get(baseAtom),
    (get, set, update) => {
      const newValue = update === import_utils.RESET ? initialValue : update instanceof Function ? update(get(baseAtom)) : update;
      set(baseAtom, newValue);
      onValueChange?.(newValue);
      const url = new URL(window.location.href);
      const parsed = queryString.parse(url.searchParams.toString());
      const searchParams = queryString.stringify(
        Object.assign(parsed, newValue)
      );
      const resultUrl = update === import_utils.RESET ? url.pathname : url.pathname + "?" + searchParams;
      if (onPathnameChange instanceof Function) {
        onPathnameChange(resultUrl);
      } else {
        window.history.pushState(null, "", resultUrl);
      }
    }
  );
  anAtom.onMount = (setAtom) => {
    const handlePopState = () => {
      setAtom(getValueWithQueryString(initialValue));
    };
    if (!getOnInit) {
      handlePopState();
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  };
  return anAtom;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  atomWithQueryString
});
//# sourceMappingURL=index.js.map