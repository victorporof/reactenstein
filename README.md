**Under heavy research and development, please don't use this yet!**

# reactenstein
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)

A react reconciler which bypasses the DOM, performs layout using Yoga and presents using WebRender.

```
git clone https://github.com/victorporof/reactenstein
cd ./reactenstein
yarn install
yarn build
```

Start the renderer server:
```
cd ./headless
cargo run --release
```

Run a benchmark:
```
cd ./benchmarks/dbmonster-react
yarn install
yarn start
```

Change [this dependency](https://github.com/victorporof/reactenstein/blob/master/benchmarks/dbmonster-react/src/index.js#L2) in benchmarks to use the default implementation:
```js
import ReactDOM from '../../../';
```
to
```js
import ReactDOM from 'react-dom';
```

Change [this line](https://github.com/victorporof/reactenstein/blob/master/src/vdom/index.js) in the implementation to switch between running the framework on the main thread or in a web worker:
```js
import API from './vdom-worker-api';
```
to
```js
import API from './vdom-sync-api';
```

Run the reconciler in development mode:
```
cd ./reactenstein
yarn serve
```