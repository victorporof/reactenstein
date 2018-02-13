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

// Keep in sync with https://github.com/victorporof/rsx-shared

export const VirtualEventType = new Map([
  // Host keyboard events
  ['KeyDown', 1],
  ['KeyPress', 2],
  ['KeyUp', 3],

  // Host mouse events
  ['MouseMove', 11],
  ['MouseDown', 12],
  ['MouseUp', 13],
  ['AuxClick', 14],
  ['Click', 15],
  ['DblClick', 16],
  ['ContextMenu', 17],
  ['Wheel', 18],
  ['Select', 19],
]);

export const EventType = new Map([
  // Keyboard events
  ['KeyDown', VirtualEventType.get('KeyDown')],
  ['KeyPress', VirtualEventType.get('KeyPress')],
  ['KeyUp', VirtualEventType.get('KeyUp')],

  // Mouse events
  ['MouseMove', VirtualEventType.get('MouseMove')],
  ['MouseDown', VirtualEventType.get('MouseDown')],
  ['MouseUp', VirtualEventType.get('MouseUp')],
  ['AuxClick', VirtualEventType.get('AuxClick')],
  ['Click', VirtualEventType.get('Click')],
  ['DblClick', VirtualEventType.get('DblClick')],
  ['ContextMenu', VirtualEventType.get('ContextMenu')],
  ['Wheel', VirtualEventType.get('Wheel')],
  ['Select', VirtualEventType.get('Select')],

  // Synthetic mouse events
  ['MouseEnter', 21],
  ['MouseLeave', 22],
  ['MouseOver', 23],
  ['MouseOut', 24],
]);

export const EventMap = new Map([
  ['onKeyDown', EventType.get('KeyDown')],
  ['onKeyPress', EventType.get('KeyPress')],
  ['onKeyUp', EventType.get('KeyUp')],

  // Mouse events
  ['onMouseMove', EventType.get('MouseMove')],
  ['onMouseDown', EventType.get('MouseDown')],
  ['onMouseUp', EventType.get('MouseUp')],
  ['onAuxClick', EventType.get('AuxClick')],
  ['onClick', EventType.get('Click')],
  ['onDblClick', EventType.get('DblClick')],
  ['onContextMenu', EventType.get('ContextMenu')],
  ['onWheel', EventType.get('Wheel')],
  ['onSelect', EventType.get('Select')],

  // Synthetic mouse events
  ['onMouseEnter', EventType.get('MouseEnter')],
  ['onMouseLeave', EventType.get('MouseLeave')],
  ['onMouseOver', EventType.get('MouseOver')],
  ['onMouseOut', EventType.get('MouseOut')],
]);

export const KeyCode = new Map([
  // Special
  ['Unidentified', 0],

  // Alphanumeric Section Writing System Keys
  ['Backquote', 1],
  ['Backslash', 2],
  ['BracketLeft', 3],
  ['BracketRight', 4],
  ['Comma', 5],
  ['Digit0', 6],
  ['Digit1', 7],
  ['Digit2', 8],
  ['Digit3', 9],
  ['Digit4', 10],
  ['Digit5', 11],
  ['Digit6', 12],
  ['Digit7', 13],
  ['Digit8', 14],
  ['Digit9', 15],
  ['Equal', 16],
  ['IntlBackslash', 17],
  ['IntlRo', 18],
  ['IntlYen', 19],
  ['KeyA', 20],
  ['KeyB', 21],
  ['KeyC', 22],
  ['KeyD', 23],
  ['KeyE', 24],
  ['KeyF', 25],
  ['KeyG', 26],
  ['KeyH', 27],
  ['KeyI', 28],
  ['KeyJ', 29],
  ['KeyK', 30],
  ['KeyL', 31],
  ['KeyM', 32],
  ['KeyN', 33],
  ['KeyO', 34],
  ['KeyP', 35],
  ['KeyQ', 36],
  ['KeyR', 37],
  ['KeyS', 38],
  ['KeyT', 39],
  ['KeyU', 40],
  ['KeyV', 41],
  ['KeyW', 42],
  ['KeyX', 43],
  ['KeyY', 44],
  ['KeyZ', 45],
  ['Minus', 46],
  ['Period', 47],
  ['Quote', 48],
  ['Semicolon', 49],
  ['Slash', 50],

  // Alphanumeric Section Functional Keys
  ['AltLeft', 51],
  ['AltRight', 52],
  ['Backspace', 53],
  ['CapsLock', 54],
  ['ContextMenu', 55],
  ['ControlLeft', 56],
  ['ControlRight', 57],
  ['Enter', 58],
  ['MetaLeft', 59],
  ['MetaRight', 60],
  ['ShiftLeft', 61],
  ['ShiftRight', 62],
  ['Space', 63],
  ['Tab', 64],

  // Alphanumeric Section Japanese and Korean keyboards
  ['Convert', 65],
  ['KanaMode', 66],
  ['Lang1', 67],
  ['Lang2', 68],
  ['Lang3', 69],
  ['Lang4', 70],
  ['Lang5', 71],
  ['NonConvert', 72],

  // Control Pad Section
  ['Delete', 73],
  ['End', 74],
  ['Help', 75],
  ['Home', 76],
  ['Insert', 77],
  ['PageDown', 78],
  ['PageUp', 79],

  // Arrow Pad Section
  ['ArrowDown', 80],
  ['ArrowLeft', 81],
  ['ArrowRight', 82],
  ['ArrowUp', 83],

  // Numpad Section
  ['NumLock', 84],
  ['Numpad0', 85],
  ['Numpad1', 86],
  ['Numpad2', 87],
  ['Numpad3', 88],
  ['Numpad4', 89],
  ['Numpad5', 90],
  ['Numpad6', 91],
  ['Numpad7', 92],
  ['Numpad8', 93],
  ['Numpad9', 94],
  ['NumpadAdd', 95],
  ['NumpadBackspace', 96],
  ['NumpadClear', 97],
  ['NumpadClearEntry', 98],
  ['NumpadComma', 99],
  ['NumpadDecimal', 100],
  ['NumpadDivide', 101],
  ['NumpadEnter', 102],
  ['NumpadEqual', 103],
  ['NumpadHash', 104],
  ['NumpadMemoryAdd', 105],
  ['NumpadMemoryClear', 106],
  ['NumpadMemoryRecall', 107],
  ['NumpadMemoryStore', 108],
  ['NumpadMemorySubtract', 109],
  ['NumpadMultiply', 110],
  ['NumpadParenLeft', 111],
  ['NumpadParenRight', 112],
  ['NumpadStar', 113],
  ['NumpadSubtract', 114],

  // Function Section
  ['Escape', 115],
  ['F1', 116],
  ['F2', 117],
  ['F3', 118],
  ['F4', 119],
  ['F5', 120],
  ['F6', 121],
  ['F7', 122],
  ['F8', 123],
  ['F9', 124],
  ['F10', 125],
  ['F11', 126],
  ['F12', 127],
  ['Fn', 128],
  ['FnLock', 129],
  ['PrintScreen', 130],
  ['ScrollLock', 131],
  ['Pause', 132],

  // Media Keys
  ['BrowserBack', 133],
  ['BrowserFavorites', 134],
  ['BrowserForward', 135],
  ['BrowserHome', 136],
  ['BrowserRefresh', 137],
  ['BrowserSearch', 138],
  ['BrowserStop', 139],
  ['Eject', 140],
  ['LaunchApp1', 141],
  ['LaunchApp2', 142],
  ['LaunchMail', 143],
  ['MediaPlayPause', 144],
  ['MediaSelect', 145],
  ['MediaStop', 146],
  ['MediaTrackNext', 147],
  ['MediaTrackPrevious', 148],
  ['Power', 149],
  ['Sleep', 150],
  ['AudioVolumeDown', 151],
  ['AudioVolumeMute', 152],
  ['AudioVolumeUp', 153],
  ['WakeUp', 154],
]);

export const KnownAttributeName = new Map([
  // HTML global attributes
  ['accesskey', 1],
  ['class', 2],
  ['contenteditable', 3],
  ['contextmenu', 4],
  ['dir', 5],
  ['draggable', 6],
  ['dropzone', 7],
  ['hidden', 8],
  ['id', 9],
  ['lang', 10],
  ['spellcheck', 11],
  ['src', 12],
  ['style', 13],
  ['tabindex', 14],
  ['title', 15],
  ['translate', 16],
]);

// RSX specific
export const KnownElementName = new Map([
  ['Root', 1],

  // HTML content sectioning
  ['address', 10],
  ['article', 11],
  ['aside', 12],
  ['footer', 13],
  ['header', 14],
  ['nav', 15],
  ['section', 16],

  // HTML text sectioning
  ['hgroup', 21],
  ['h1', 22],
  ['h2', 23],
  ['h3', 24],
  ['h4', 25],
  ['h5', 26],
  ['h6', 27],

  // HTML text content
  ['main', 31],
  ['div', 32],
  ['span', 33],
  ['p', 34],
  ['ol', 35],
  ['ul', 36],
  ['li', 37],
  ['dl', 38],
  ['dt', 39],
  ['dd', 40],
  ['figure', 41],
  ['figcaption', 42],
  ['hr', 43],
  ['pre', 44],
  ['blockquote', 45],

  // HTML inline text semantics
  ['a', 51],
  ['b', 52],
  ['i', 53],
  ['u', 54],
  ['s', 55],
  ['em', 56],
  ['mark', 57],
  ['q', 58],
  ['cite', 59],
  ['code', 60],
  ['data', 61],
  ['time', 62],
  ['sub', 63],
  ['sup', 64],
  ['br', 65],
  ['wbr', 66],

  // HTML image and multimedia
  ['img', 71],
  ['area', 72],
  ['map', 73],
  ['audio', 74],
  ['video', 75],
  ['track', 76],

  // HTML forms
  ['button', 81],
  ['datalist', 82],
  ['fieldset', 83],
  ['form', 84],
  ['input', 85],
  ['label', 86],
  ['legend', 87],
  ['meter', 88],
  ['optgroup', 89],
  ['option', 90],
  ['output', 91],
  ['progress', 92],
  ['select', 93],
  ['textarea', 94],

  // React Fiber components
  ['fragment', 1000],

  // React Native basic components
  ['View', 1001],
  ['Text', 1002],
  ['Image', 71],
  ['TextInput', 1004],
  ['ScrollView', 1005],

  // React Native user interface
  ['Button', 81],
  ['Picker', 1007],
  ['Slider', 1008],
  ['Switch', 1009],

  // React Native list views
  ['FlatList', 1010],
  ['SectionList', 1011],
]);
