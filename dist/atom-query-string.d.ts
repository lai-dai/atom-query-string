import * as jotai from 'jotai';
import { RESET } from 'jotai/utils';

type SetStateAction<S> = S | ((prevState: S) => S);
interface QueryString {
    parse: (str: string) => Record<string, any>;
    stringify: (obj: Record<string, any>) => string;
}
interface AtomWithQueryStringOptions<Value> {
    onValueChange?: (value: Value) => void;
    onPathnameChange?: (pathname: string) => void;
    queryString?: QueryString;
    getOnInit?: boolean;
}
declare const atomWithQueryString: <Value extends object>(initialValue: Readonly<Value>, { onValueChange, onPathnameChange, queryString, getOnInit, }?: AtomWithQueryStringOptions<Value>) => jotai.WritableAtom<Value, [update: typeof RESET | SetStateAction<Value>], void>;

export { AtomWithQueryStringOptions, QueryString, atomWithQueryString };
