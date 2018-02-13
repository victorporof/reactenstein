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

import FreeSans from '../../fonts/FreeSans.ttf';
import Renderer from '../../rsx-renderers/packages/web-renderer/src/remote';
import Module from '../../rsx-embedding/rsx-webapi-client-json/src/main.rs';
// import Module from '../../rsx-embedding/rsx-webapi-client-bincode/src/main.rs';

const VOID = 'undefined';
const INT = 'number';
const STRING = 'string';
const ARRAY = 'array';

export default class {
  _module = Module()
  _width = 0
  _height = 0

  constructor() {
    this._asm = {
      // Main API

      _initializeRuntime: this._module.cwrap('initialize_runtime'),
      _getDisplayList: this._module.cwrap('get_display_list', STRING, [INT, INT]),
      _getDisplayListDiff: this._module.cwrap('get_display_list_diff', STRING, [INT, INT]),
      _getResourceUpdates: this._module.cwrap('get_resource_updates', STRING),
      _gc: this._module.cwrap('gc', VOID),

      // Debugging API

      printDiag: this._module.cwrap('print_diag', VOID),

      // Resource API

      loadFont: this._module.cwrap('load_font', VOID, [STRING, STRING, INT]),
      loadImage: this._module.cwrap('load_image', VOID, [STRING, STRING]),

      // DOM API

      createOrphanNormalNode: this._module.cwrap('create_orphan_normal_node', INT, [INT]),
      createOrphanInlineTextNode: this._module.cwrap('create_orphan_inline_text_node', INT, [STRING]),
      appendChild: this._module.cwrap('append_child', VOID, [INT, INT]),
      removeChild: this._module.cwrap('remove_child', VOID, [INT]),
      appendChildToContainer: this._module.cwrap('append_child_to_container', VOID, [INT]),
      removeChildToContainer: this._module.cwrap('remove_child_from_container', VOID, [INT]),
      setTextContent: this._module.cwrap('set_text_content', VOID, [INT, STRING]),
      setStyles: this._module.cwrap('set_styles', VOID, [INT, ARRAY, INT]),
      addEventListener: this._module.cwrap('add_event_listener', VOID, [INT, INT]),
      removeEventListener: this._module.cwrap('remove_event_listener', VOID, [INT, INT]),

      // Stylesheet API

      registerStyle: this._module.cwrap('register_style', INT, [STRING]),
      unregisterStyle: this._module.cwrap('unregister_style', VOID, [STRING]),

      // Events API

      receiveKeyEvent: this._module.cwrap('receive_key_event', VOID, [INT, INT, INT, INT, INT, INT]),
      receiveMouseEvent: this._module.cwrap('receive_mouse_event', VOID, [INT, INT, INT, INT, INT, INT, INT, INT]),
      _pollEvents: this._module.cwrap('poll_events', STRING),

      // Custom API

      setFrameSize: (width, height) => {
        this._width = width;
        this._height = height;
      },

      postFrameDiff: () => {
        this._asm._gc();
        const displayListDiff = this._asm._getDisplayListDiff(this._width, this._height);
        const resourceUpdates = this._asm._getResourceUpdates();
        const polledEvents = this._asm._pollEvents();
        Renderer.insertResourceUpdates(resourceUpdates);
        Renderer.applyDisplayListDiff(displayListDiff);
        return { polledEvents };
      },

      generateFrameDiff: () => {
        this._asm._gc();
        const displayListDiff = this._asm._getDisplayListDiff(this._width, this._height);
        const resourceUpdates = this._asm._getResourceUpdates();
        const polledEvents = this._asm._pollEvents();
        return { displayListDiff, resourceUpdates, polledEvents };
      },

      generateFrameBlob: () => {
        this._asm._gc();
        const [ptr, len] = JSON.parse(this._asm._getDisplayList(this._width, this._height));
        const displayListBlob = this._module.HEAP8.subarray(ptr, ptr + len);
        const resourceUpdates = this._asm._getResourceUpdates();
        const polledEvents = this._asm._pollEvents();
        return { displayListBlob, resourceUpdates, polledEvents };
      },

      generateFrameJson: () => {
        this._asm._gc();
        const displayListJson = this._asm._getDisplayList(this._width, this._height);
        const resourceUpdates = this._asm._getResourceUpdates();
        const polledEvents = this._asm._pollEvents();
        return { displayListJson, resourceUpdates, polledEvents };
      },
    };

    this._asm._initializeRuntime();
    this._asm.loadFont('FreeSans', FreeSans, 0);
  }

  callImmediate(call, args) {
    return this._asm[call](...args);
  }

  callImmediateMany(many) {
    many.forEach(({ call, args }) => this._asm[call](...args));
  }
}
