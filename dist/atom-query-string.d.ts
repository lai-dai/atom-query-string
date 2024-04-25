import { WritableAtom } from 'jotai';
import { RESET } from 'jotai/utils';

type Unsubscribe = () => void;
type SetStateActionWithReset<Value> = Value | typeof RESET | ((prev: Value) => Value);
type WithInitialValue<Value> = {
    init: Value;
};
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
declare function atomWithQueryString<Value extends object>(initialValue: Value, { onValueChange, onPathnameChange, queryString, getOnInit, }?: AtomWithQueryStringOptions<Value>): WritableAtom<Value, [SetStateActionWithReset<Value>], void> & WithInitialValue<Value>;

export { AtomWithQueryStringOptions, QueryString, atomWithQueryString };
