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

import { waitFor, waitForMany } from '../util';

export default class {
  constructor(vdom, styleManager, eventManager, id) {
    this._vdom = vdom;
    this._styleManager = styleManager;
    this._eventManager = eventManager;
    this._id = id;
  }

  get vdom() {
    return this._vdom;
  }

  get styleManager() {
    return this._styleManager;
  }

  get eventManager() {
    return this._eventManager;
  }

  get id() {
    return this._id;
  }

  appendChild(child) {
    waitForMany([this._id, child._id], ([thisId, childId]) => {
      this._vdom.appendChild(thisId, childId);
    });
  }

  appendToContainer() {
    waitFor(this._id, (id) => {
      this._vdom.appendChildToContainer(id);
    });
  }

  addEventListener(type, callback) {
    waitFor(this._id, (id) => {
      this._eventManager.registerEventListener(id, type, callback);
    });
  }

  removeEventListener(type, callback) {
    waitFor(this._id, (id) => {
      this._eventManager.deregisterEventListener(id, type, callback);
    });
  }
}
