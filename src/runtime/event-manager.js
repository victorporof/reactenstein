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

import { VirtualEventType, EventType, KeyCode } from '../components/const';

const getModifiers = e =>
  [e.altKey ? 1 : 0, e.ctrlKey ? 1 : 0, e.metaKey ? 1 : 0, e.shiftKey ? 1 : 0];

const getKeyParams = e =>
  [...getModifiers(e), KeyCode.get(e.code)];

const getMouseParams = (e, { offsetLeft, offsetTop }) =>
  [...getModifiers(e), e.button, e.pageX - offsetLeft, e.pageY - offsetTop];

export default class {
  constructor(vdom) {
    this._vdom = vdom;
    this._bindings = new Map();
  }

  mount(parent) {
    this.unmount(this._parent);

    parent.ownerDocument.defaultView.addEventListener('keydown', this.handleKeyDown, true);
    parent.ownerDocument.defaultView.addEventListener('keypress', this.handleKeyPress, true);
    parent.ownerDocument.defaultView.addEventListener('keyup', this.handleKeyUp, true);
    parent.ownerDocument.defaultView.addEventListener('mousemove', this.handleMouseMove, true);
    parent.ownerDocument.defaultView.addEventListener('click', this.handleMouseClick, true);
  }

  unmount() {
    if (!this._parent) {
      return;
    }

    this._parent.ownerDocument.defaultView.removeEventListener('keydown', this.handleKeyDown, true);
    this._parent.ownerDocument.defaultView.removeEventListener('keypress', this.handleKeyPress, true);
    this._parent.ownerDocument.defaultView.removeEventListener('keyup', this.handleKeyUp, true);
    this._parent.ownerDocument.defaultView.removeEventListener('mousemove', this.handleMouseMove, true);
    this._parent.ownerDocument.defaultView.removeEventListener('click', this.handleMouseClick, true);
    this._parent = null;
  }

  registerEventListener(componentId, eventType, eventListener) {
    const key = `${componentId} ${eventType}`;

    this._vdom.addEventListener(componentId, eventType);
    this._bindings.set(key, eventListener);
  }

  deregisterEventListener(componentId, eventType) {
    const key = `${componentId} ${eventType}`;

    this._vdom.removeEventListener(componentId, eventType);
    this._bindings.delete(key);
  }

  updateOffsets(left, top) {
    this.offsetLeft = left;
    this.offsetTop = top;
  }

  synthesizeEvent(internalEvent) {
    const componentId = internalEvent.base.target;
    const eventType = EventType.get(internalEvent.base.event_type);
    const key = `${componentId} ${eventType}`;

    const listener = this._bindings.get(key);
    listener();
  }

  triggerEvents(polledEventsJson) {
    JSON.parse(polledEventsJson).forEach((polledEvent) => {
      let internalEvent;
      if (internalEvent = polledEvent.KeyEvent) {
        this.synthesizeEvent(internalEvent);
      } else if (internalEvent = polledEvent.MouseEvent) {
        this.synthesizeEvent(internalEvent);
      }
    });
  }

  handleKeyDown = (e) => {
    e.stopPropagation();
    this._vdom.receiveKeyEvent(VirtualEventType.get('KeyDown'), ...getKeyParams(e));
  }

  handleKeyPress = (e) => {
    e.stopPropagation();
    this._vdom.receiveKeyEvent(VirtualEventType.get('KeyPress'), ...getKeyParams(e));
  }

  handleKeyUp = (e) => {
    e.stopPropagation();
    this._vdom.receiveKeyEvent(VirtualEventType.get('KeyUp'), ...getKeyParams(e));
  }

  handleMouseMove = (e) => {
    e.stopPropagation();
    this._vdom.receiveMouseEvent(VirtualEventType.get('MouseMove'), ...getMouseParams(e, this));
  }

  handleMouseClick = (e) => {
    e.stopPropagation();
    this._vdom.receiveMouseEvent(VirtualEventType.get('Click'), ...getMouseParams(e, this));
  }
}
