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

import API from './vdom-worker-api';
// import API from './vdom-sync-api';

export default class {
  constructor() {
    this._api = new API();
    this._lastFrame = {
      displayListDiff: '[]',
      resourceUpdates: '[]',
      polledEvents: '[]',
    };
  }

  setFrameSize(...args) {
    return this._api.asyncCall('setFrameSize', args);
  }

  generateFrameDiff(...args) {
    return this._api.asyncCall('generateFrameDiff', args);
  }

  postFrameDiff(...args) {
    return this._api.asyncCall('postFrameDiff', args);
  }

  // Debugging API

  printDiag(...args) {
    return this._api.voidCall('printDiag', args);
  }

  // Resource API

  loadFont(...args) {
    return this._api.voidCall('loadFont', args);
  }

  loadImage(...args) {
    return this._api.voidCall('loadImage', args);
  }

  // DOM API

  createOrphanNormalNode(...args) {
    return this._api.asyncCall('createOrphanNormalNode', args);
  }

  createOrphanInlineTextNode(...args) {
    return this._api.asyncCall('createOrphanInlineTextNode', args);
  }

  appendChild(...args) {
    return this._api.voidCall('appendChild', args);
  }

  appendChildToContainer(...args) {
    return this._api.voidCall('appendChildToContainer', args);
  }

  setStyles(...args) {
    return this._api.voidCall('setStyles', args);
  }

  setTextContent(...args) {
    return this._api.voidCall('setTextContent', args);
  }

  addEventListener(...args) {
    return this._api.voidCall('addEventListener', args);
  }

  removeEventListener(...args) {
    return this._api.voidCall('removeEventListener', args);
  }

  // Stylesheet API

  registerStyle(...args) {
    return this._api.asyncCall('registerStyle', args);
  }

  // Events API

  receiveKeyEvent(...args) {
    return this._api.voidCall('receiveKeyEvent', args);
  }

  receiveMouseEvent(...args) {
    return this._api.voidCall('receiveMouseEvent', args);
  }

  pollEvents(...args) {
    return this._api.asyncCall('pollEvents', args);
  }
}
