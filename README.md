# atomWithQueryString

## how to use this

1. install dependencies

```
npm i github:lai-dai/atom-query-string
```

2. use

```js
import { atomWithQueryString } from "@lai-dai/atom-query-string";

const fooAtom = atomWithQueryString({
  foo: "foo",
});

// in Component
const [state, setState] = useAtom(fooAtom);
const reset = useResetAtom(fooAtom);
```
