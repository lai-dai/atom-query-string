import * as jotai from 'jotai';
import { RESET } from 'jotai/utils';

type Unsubscribe = () => void;
type SetStateActionWithReset<Value> = Value | typeof RESET | ((prev: Value) => Value);
interface QueryString<Value> {
    parse: (str: string, initialValue: Value) => Value;
    stringify: (obj: Value) => string;
    get: (initialValue: Value) => Value;
    subscribe?: (callback: (value: Value) => void, initialValue: Value) => Unsubscribe;
}
interface AtomWithQueryStringOptions<Value> {
    onValueChange?: (value: Value) => void;
    onPathnameChange?: (pathname: string) => void;
    queryString?: QueryString<Value>;
    getOnInit?: boolean;
}
declare function atomWithQueryString<Value extends object>(initialValue: Value, { onValueChange, onPathnameChange, queryString, getOnInit, }?: AtomWithQueryStringOptions<Value>): jotai.WritableAtom<Value, [update: SetStateActionWithReset<Value>, isPushState?: boolean | undefined], void>;

export { AtomWithQueryStringOptions, QueryString, atomWithQueryString };
