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

/* eslint no-cond-assign: "off" */

import BaseNode from './base-node';
import { EventMap, KnownElementName } from '../components/const';
import { waitFor } from '../util';

const DEFAULT_ID = 'undefined';
const DEFAULT_CLASS_NAME = '-rsx';

export default class extends BaseNode {
  constructor(vdom, styleManager, eventManager, type, props = {}) {
    super(vdom, styleManager, eventManager, vdom.createOrphanNormalNode(KnownElementName.get(type)));

    styleManager.on('register-style', this.updateStyles);
    this.setStyles(type, DEFAULT_ID, DEFAULT_CLASS_NAME);
    this.receiveProps({}, props);
  }

  receiveProps(oldProps, newProps) {
    this._oldProps = oldProps;
    this._newProps = newProps;

    Object.entries(newProps).forEach(([propName, propValue]) => {
      let eventType;
      if (eventType = EventMap.get(propName)) {
        this.addEventListener(eventType, propValue);
      } else if (propName === 'id') {
        this.setStyles(this._tagName, propValue, this._styleClassName);
      } else if (propName === 'className') {
        this.setStyles(this._tagName, this._styleId, propValue);
      }
    });
  }

  setStyles(tagName, styleId, styleClassName) {
    if (this._tagName === tagName && this._styleId === styleId && this._styleClassName === styleClassName) {
      return;
    }

    this._tagName = tagName;
    this._styleId = styleId;
    this._styleClassName = styleClassName;

    waitFor(this._id, (id) => {
      const styleIds = this._styleManager.getStylesForElement(tagName, styleId, styleClassName);
      if (styleIds.length) {
        this._vdom.setStyles(id, styleIds, styleIds.length);
      }
    });
  }

  updateStyles = () => {
    this.setStyles(this._tagName, this._styleId, this._styleClassName);
  }
}
