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

import BaseNode from './base-node';
import { waitFor } from '../util';

export default class extends BaseNode {
  constructor(vdom, styleManager, eventManager, textContent) {
    super(vdom, styleManager, eventManager, vdom.createOrphanInlineTextNode(textContent));
    this._textContent = textContent;
  }

  setTextContent(textContent) {
    if (this._textContent === textContent) {
      return;
    }
    waitFor(this._id, (id) => {
      this._textContent = textContent;
      this._vdom.setTextContent(id, textContent);
    });
  }
}
