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

/* global requestAnimationFrame, setTimeout */
/* eslint no-multi-assign: "off", no-param-reassign: "off" */

import RootNode from '../components/root-node';
import Reconciler from '../reconciler/';
import EventManager from './event-manager';
import StyleManager from './style-manager';
import VDOM from '../vdom';
import { waitFor } from '../util';
import { RSXDOMRenderer, RSXRemoteRenderer } from './render-context';

export * from '../../rsx-renderers/packages/web-renderer/src/lib';

const RENDER_CONTEXT_SYMBOL = Symbol('Reactenstein Render Context');

export class RenderContext {
  constructor(Renderer) {
    this._vdom = new VDOM();

    this._polledEvents = [];
    this._resourceUpdates = [];
    this._displayListDiff = [];

    this._renderer = new Renderer();
    this._styleManager = new StyleManager(this._vdom);
    this._eventManager = new EventManager(this._vdom);
    this._root = Reconciler.createContainer(new RootNode(this));
  }

  static for(parent, Renderer = RSXRemoteRenderer) {
    return parent[RENDER_CONTEXT_SYMBOL] || (() => {
      const renderContext = parent[RENDER_CONTEXT_SYMBOL] = new RenderContext(Renderer);
      renderContext.mount(parent);
      renderContext.update();
      return renderContext;
    })();
  }

  get styleManager() {
    return this._styleManager;
  }

  get eventManager() {
    return this._eventManager;
  }

  mount(parent) {
    this._parent = parent;
    this._renderer.mount(parent);
    this._styleManager.mount(parent);
    this._eventManager.mount(parent);

    const { left, top } = this._parent.getBoundingClientRect();
    const width = this._parent.ownerDocument.defaultView.innerWidth;
    const height = this._parent.ownerDocument.defaultView.innerHeight;

    this._eventManager.updateOffsets(left, top);
    this._vdom.setFrameSize(width, height);
  }

  render(element) {
    this._element = element;
  }

  update = () => {
    if (this._element) {
      Reconciler.updateContainer(this._element, this._root, null);
      this._element = null;
    }

    if (this._renderer instanceof RSXRemoteRenderer) {
      waitFor(this._vdom.postFrameDiff(), ({ polledEvents }) => {
        requestAnimationFrame(this.update);
        this._eventManager.triggerEvents(polledEvents);
      });
    } else if (this._renderer instanceof RSXDOMRenderer) {
      waitFor(this._vdom.generateFrameDiff(), ({ displayListDiff, resourceUpdates, polledEvents }) => {
        requestAnimationFrame(this.update);
        this._eventManager.triggerEvents(polledEvents);
        this._renderer.insertResourceUpdates(resourceUpdates);
        this._renderer.applyDisplayListDiff(displayListDiff);
      });
    }
  }
}
