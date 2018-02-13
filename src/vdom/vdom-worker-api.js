/*
Copyright 2016 Mozilla
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
*/

/* eslint import/default: "off" */

import Worker from './vdom.worker';
import { Deferred } from '../util';

export default class {
  constructor() {
    this._id = 0;
    this._pending = [];
    this._callbacks = new Map();

    this._worker = new Worker();
    this._worker.addEventListener('message', this._onMessage);
  }

  static isWorker() {
    return true;
  }

  addMessageListener(cb) {
    this._worker.addEventListener('message', cb);
  }

  removeMessageistener(cb) {
    this._worker.removeEventListener('message', cb);
  }

  _onMessage = (event) => {
    if (event.data.id) {
      this._callbacks.get(event.data.id).resolve(event.data.retval);
      this._callbacks.delete(event.data.id);
    }
  }

  voidCall(call, args) {
    this._pending.push({ call, args });
  }

  asyncCall(call, args) {
    this._id += 1;

    const id = this._id;
    const pending = this._pending;
    const deferred = new Deferred();

    this._callbacks.set(id, deferred);
    this._worker.postMessage({
      id, pending, call, args,
    });

    this._pending.length = 0;

    return deferred.promise;
  }
}
