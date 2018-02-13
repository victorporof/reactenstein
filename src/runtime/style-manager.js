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

import EventEmitter from 'events';
import SelectorParser from 'postcss-selector-parser';
import Color from 'color';
import { waitFor } from '../util';

const findRule = (stylesheet, selectorText) =>
  [...stylesheet.cssRules].find(e => e.selectorText === selectorText);

export default class StyleManager extends EventEmitter {
  constructor(vdom) {
    super();
    this.setMaxListeners(65535);

    this._vdom = vdom;
    this._rules = new Map();
    this._cache = new Map();
  }

  mount(parent) {
    [...parent.ownerDocument.styleSheets].forEach(s => this.registerStylesheet(s));
  }

  unmount() {
    this._rules = new Map();
    this._cache = new Map();
  }

  getStylesForElement(tagName, id, className) {
    const key = `${tagName}#${id}.${className}`;
    const cached = this._cache.get(key);
    if (cached) {
      return cached;
    }

    return this.cacheStyleIds(key, [
      ...this.getStylesForTagName(tagName),
      ...this.getStylesForId(id),
      ...this.getStylesForClassName(className),
    ]);
  }

  getStylesForTagName(tagName) {
    const cached = this._cache.get(tagName);
    if (cached) {
      return cached;
    }
    return this.cacheStyleIds(tagName, [this._rules.get(tagName)].filter(v => v !== undefined));
  }

  getStylesForId(id) {
    const cached = this._cache.get(id);
    if (cached) {
      return cached;
    }
    return this.cacheStyleIds(id, [this._rules.get(`#${id}`)].filter(v => v !== undefined));
  }

  getStylesForClassName(className) {
    const cached = this._cache.get(className);
    if (cached) {
      return cached;
    }
    return this.cacheStyleIds(className, className.split(' ').map(name => this._rules.get(`.${name}`)).filter(v => v !== undefined));
  }

  cacheStyleIds(uniqKey, styleIds) {
    const ffiIds = new Uint8Array(styleIds);
    this._cache.set(uniqKey, ffiIds);
    return ffiIds;
  }

  registerStylesheet(stylesheet) {
    const parser = SelectorParser(selectors => selectors.each((selector) => {
      const selectorText = String(selector);
      this.registerSelector(findRule(stylesheet, selectorText), selectorText);
    }));
    [...stylesheet.cssRules].forEach(v => parser.processSync(v.selectorText));
  }

  registerSelector(cssRule, selector) {
    let declarations = [];
    let style;

    try {
      style = cssRule.style; // eslint-disable-line
    } catch (e) {
      return;
    }

    // Layout styles

    const alignContent = style.getPropertyValue('align-content');
    const alignItems = style.getPropertyValue('align-items');
    const alignSelf = style.getPropertyValue('align-self');
    const borderBottom = style.getPropertyValue('border-bottom-width');
    const borderEnd = style.getPropertyValue('border-end-width');
    const borderLeft = style.getPropertyValue('border-left-width');
    const borderRight = style.getPropertyValue('border-right-width');
    const borderStart = style.getPropertyValue('border-start-width');
    const borderTop = style.getPropertyValue('border-top-width');
    const bottom = style.getPropertyValue('bottom');
    const display = style.getPropertyValue('display');
    const end = style.getPropertyValue('end');
    const flex = style.getPropertyValue('flex');
    const flexBasis = style.getPropertyValue('flex-basis');
    const flexDirection = style.getPropertyValue('flex-direction');
    const flexGrow = style.getPropertyValue('flex-grow');
    const flexShrink = style.getPropertyValue('flex-shrink');
    const flexWrap = style.getPropertyValue('flex-wrap');
    const height = style.getPropertyValue('height');
    const justifyContent = style.getPropertyValue('justify-content');
    const left = style.getPropertyValue('left');
    const marginBottom = style.getPropertyValue('margin-bottom');
    const marginEnd = style.getPropertyValue('margin-end');
    const marginLeft = style.getPropertyValue('margin-left');
    const marginRight = style.getPropertyValue('margin-right');
    const marginStart = style.getPropertyValue('margin-start');
    const marginTop = style.getPropertyValue('margin-top');
    const maxHeight = style.getPropertyValue('max-height');
    const maxWidth = style.getPropertyValue('max-width');
    const minHeight = style.getPropertyValue('min-height');
    const minWidth = style.getPropertyValue('min-width');
    const overflow = style.getPropertyValue('overflow');
    const paddingBottom = style.getPropertyValue('padding-bottom');
    const paddingEnd = style.getPropertyValue('padding-end');
    const paddingLeft = style.getPropertyValue('padding-left');
    const paddingRight = style.getPropertyValue('padding-right');
    const paddingStart = style.getPropertyValue('padding-start');
    const paddingTop = style.getPropertyValue('padding-top');
    const position = style.getPropertyValue('position');
    const right = style.getPropertyValue('right');
    const start = style.getPropertyValue('start');
    const top = style.getPropertyValue('top');
    const width = style.getPropertyValue('width');

    // Theme styles

    const backgroundColor = style.getPropertyValue('background-color');
    const borderBottomColor = style.getPropertyValue('border-bottom-color');
    const borderBottomStyle = style.getPropertyValue('border-bottom-style');
    const borderLeftColor = style.getPropertyValue('border-left-color');
    const borderLeftStyle = style.getPropertyValue('border-left-style');
    const borderRightColor = style.getPropertyValue('border-right-color');
    const borderRightStyle = style.getPropertyValue('border-right-style');
    const borderTopColor = style.getPropertyValue('border-top-color');
    const borderTopStyle = style.getPropertyValue('border-top-style');
    const color = style.getPropertyValue('color');
    // const cursor = style.getPropertyValue('cursor');
    // const fontCaps = style.getPropertyValue('font-caps');
    // const fontFamily = style.getPropertyValue('font-family');
    const fontSize = style.getPropertyValue('font-size');
    // const fontStretch = style.getPropertyValue('font-stretch');
    // const fontStyle = style.getPropertyValue('font-style');
    const fontWeight = style.getPropertyValue('font-weight');
    // const opacity = style.getPropertyValue('opacity');
    // const textShadow = style.getPropertyValue('text-shadow');
    // const visibility = style.getPropertyValue('visibility');

    // Generic helpers.

    const makeLayout = (key, value) => (value ? {
      Layout: {
        [key]: value,
      },
    } : undefined);

    const makeTheme = (key, value) => (value ? {
      Theme: {
        [key]: value,
      },
    } : undefined);

    const makeStyleUnit = value => ({
      Point: parseFloat(value),
    });

    // Layout style helpers.

    const makeDisplay = value => ({
      flex: 'Flex',
      none: 'None',
    }[value]);

    const makeOverflow = value => ({
      visible: 'Visible',
      hidden: 'Hidden',
      scroll: 'Scroll',
    }[value]);

    const makePosition = value => ({
      relative: 'Relative',
      absolute: 'Absolute',
    }[value]);

    const makeFlexAlign = value => ({
      auto: 'Auto',
      'flex-start': 'FlexStart',
      center: 'Center',
      'flex-end': 'FlexEnd',
      stretch: 'Stretch',
      baseline: 'Baseline',
      'space-between': 'SpaceBetween',
      'space-around': 'SpaceAround',
    }[value]);

    const makeFlexDirection = value => ({
      column: 'Column',
      'column-reverse': 'ColumnReverse',
      row: 'Row',
      'row-reverse': 'RowReverse',
    }[value]);

    const makeFlexWrap = value => ({
      nowrap: 'NoWrap',
      wrap: 'Wrap',
      'wrap-reverse': 'WrapReverse',
    }[value]);

    const makeFlexJustify = value => ({
      'flex-start': 'FlexStart',
      center: 'Center',
      'flex-end': 'FlexEnd',
      'space-between': 'SpaceBetween',
      'space-around': 'SpaceAround',
    }[value]);

    // Theme style helpers.

    const makeColor = (value) => {
      const c = Color(value);
      return {
        red: c.red(),
        green: c.green(),
        blue: c.blue(),
        alpha: c.alpha() * 255,
      };
    };

    const makeBorderStyle = value => ({
      none: 'None',
      solid: 'Solid',
      double: 'Double',
      dotted: 'Dotted',
      dashed: 'Dashed',
      hidden: 'Hidden',
      groove: 'Groove',
      ridge: 'Ridge',
      inset: 'Inset',
      outset: 'Outset',
    }[value]);

    const makeFontSize = value => ({
      system: 'System',
      smaller: 'Smaller',
      larger: 'Larger',
    }[value] || { Length: makeStyleUnit(value) });

    const makeFontWeight = value => ({
      system: 'System',
      normal: 'Normal',
      bold: 'Bold',
      bolder: 'Bolder',
      lighter: 'Lighter',
    }[value] || { Weight: parseFloat(value) });

    // Declarations builder.

    if (alignContent) {
      declarations.push(makeLayout('AlignContent', makeFlexAlign(alignContent)));
    }
    if (alignItems) {
      declarations.push(makeLayout('AlignItems', makeFlexAlign(alignItems)));
    }
    if (alignSelf) {
      declarations.push(makeLayout('AlignSelf', makeFlexAlign(alignSelf)));
    }
    if (borderBottom && parseFloat(borderBottom) !== 0) {
      declarations.push(makeLayout('BorderBottom', parseFloat(borderBottom)));
    }
    if (borderEnd && parseFloat(borderEnd) !== 0) {
      declarations.push(makeLayout('BorderEnd', parseFloat(borderEnd)));
    }
    if (borderLeft && parseFloat(borderLeft) !== 0) {
      declarations.push(makeLayout('BorderLeft', parseFloat(borderLeft)));
    }
    if (borderRight && parseFloat(borderRight) !== 0) {
      declarations.push(makeLayout('BorderRight', parseFloat(borderRight)));
    }
    if (borderStart && parseFloat(borderStart) !== 0) {
      declarations.push(makeLayout('BorderStart', parseFloat(borderStart)));
    }
    if (borderTop && parseFloat(borderTop) !== 0) {
      declarations.push(makeLayout('BorderTop', parseFloat(borderTop)));
    }
    if (bottom) {
      declarations.push(makeLayout('Bottom', makeStyleUnit(bottom)));
    }
    if (display && display !== 'flex') {
      declarations.push(makeLayout('Display', makeDisplay(display)));
    }
    if (end) {
      declarations.push(makeLayout('End', makeStyleUnit(end)));
    }
    if (flex) {
      declarations.push(makeLayout('Flex', parseFloat(flex)));
    }
    if (flexBasis) {
      declarations.push(makeLayout('FlexBasis', makeStyleUnit(flexBasis)));
    }
    if (flexDirection) {
      declarations.push(makeLayout('FlexDirection', makeFlexDirection(flexDirection)));
    }
    if (flexGrow) {
      declarations.push(makeLayout('FlexGrow', parseFloat(flexGrow)));
    }
    if (flexShrink) {
      declarations.push(makeLayout('FlexShrink', parseFloat(flexShrink)));
    }
    if (flexWrap) {
      declarations.push(makeLayout('FlexWrap', makeFlexWrap(flexWrap)));
    }
    if (height) {
      declarations.push(makeLayout('Height', makeStyleUnit(height)));
    }
    if (justifyContent) {
      declarations.push(makeLayout('JustifyContent', makeFlexJustify(justifyContent)));
    }
    if (left) {
      declarations.push(makeLayout('Left', makeStyleUnit(left)));
    }
    if (marginBottom && parseFloat(marginBottom) !== 0) {
      declarations.push(makeLayout('MarginBottom', makeStyleUnit(marginBottom)));
    }
    if (marginEnd && parseFloat(marginEnd) !== 0) {
      declarations.push(makeLayout('MarginEnd', makeStyleUnit(marginEnd)));
    }
    if (marginLeft && parseFloat(marginLeft) !== 0) {
      declarations.push(makeLayout('MarginLeft', makeStyleUnit(marginLeft)));
    }
    if (marginRight && parseFloat(marginRight) !== 0) {
      declarations.push(makeLayout('MarginRight', makeStyleUnit(marginRight)));
    }
    if (marginStart && parseFloat(marginStart) !== 0) {
      declarations.push(makeLayout('MarginStart', makeStyleUnit(marginStart)));
    }
    if (marginTop && parseFloat(marginTop) !== 0) {
      declarations.push(makeLayout('MarginTop', makeStyleUnit(marginTop)));
    }
    if (maxHeight) {
      declarations.push(makeLayout('MaxHeight', makeStyleUnit(maxHeight)));
    }
    if (maxWidth) {
      declarations.push(makeLayout('MaxWidth', makeStyleUnit(maxWidth)));
    }
    if (minHeight) {
      declarations.push(makeLayout('MinHeight', makeStyleUnit(minHeight)));
    }
    if (minWidth) {
      declarations.push(makeLayout('MinWidth', makeStyleUnit(minWidth)));
    }
    if (overflow) {
      declarations.push(makeLayout('Overflow', makeOverflow(overflow)));
    }
    if (paddingBottom && parseFloat(paddingBottom) !== 0) {
      declarations.push(makeLayout('PaddingBottom', makeStyleUnit(paddingBottom)));
    }
    if (paddingEnd && parseFloat(paddingEnd) !== 0) {
      declarations.push(makeLayout('PaddingEnd', makeStyleUnit(paddingEnd)));
    }
    if (paddingLeft && parseFloat(paddingLeft) !== 0) {
      declarations.push(makeLayout('PaddingLeft', makeStyleUnit(paddingLeft)));
    }
    if (paddingRight && parseFloat(paddingRight) !== 0) {
      declarations.push(makeLayout('PaddingRight', makeStyleUnit(paddingRight)));
    }
    if (paddingStart && parseFloat(paddingStart) !== 0) {
      declarations.push(makeLayout('PaddingStart', makeStyleUnit(paddingStart)));
    }
    if (paddingTop && parseFloat(paddingTop) !== 0) {
      declarations.push(makeLayout('PaddingTop', makeStyleUnit(paddingTop)));
    }
    if (position) {
      declarations.push(makeLayout('Position', makePosition(position)));
    }
    if (right) {
      declarations.push(makeLayout('Right', makeStyleUnit(right)));
    }
    if (start) {
      declarations.push(makeLayout('Start', makeStyleUnit(start)));
    }
    if (top) {
      declarations.push(makeLayout('Top', makeStyleUnit(top)));
    }
    if (width) {
      declarations.push(makeLayout('Width', makeStyleUnit(width)));
    }

    if (backgroundColor && backgroundColor !== 'initial') {
      declarations.push(makeTheme('BackgroundColor', makeColor(backgroundColor)));
    }
    if (borderBottomColor && borderBottomColor !== 'initial') {
      declarations.push(makeTheme('BorderBottomColor', makeColor(borderBottomColor)));
    }
    if (borderBottomStyle && borderBottomStyle !== 'initial') {
      declarations.push(makeTheme('BorderBottomStyle', makeBorderStyle(borderBottomStyle)));
    }
    if (borderLeftColor && borderLeftColor !== 'initial') {
      declarations.push(makeTheme('BorderLeftColor', makeColor(borderLeftColor)));
    }
    if (borderLeftStyle && borderLeftStyle !== 'initial') {
      declarations.push(makeTheme('BorderLeftStyle', makeBorderStyle(borderLeftStyle)));
    }
    if (borderRightColor && borderRightColor !== 'initial') {
      declarations.push(makeTheme('BorderRightColor', makeColor(borderRightColor)));
    }
    if (borderRightStyle && borderRightStyle !== 'initial') {
      declarations.push(makeTheme('BorderRightStyle', makeBorderStyle(borderRightStyle)));
    }
    if (borderTopColor && borderTopColor !== 'initial') {
      declarations.push(makeTheme('BorderTopColor', makeColor(borderTopColor)));
    }
    if (borderTopStyle && borderTopStyle !== 'initial') {
      declarations.push(makeTheme('BorderTopStyle', makeBorderStyle(borderTopStyle)));
    }
    if (color && color !== 'initial') {
      declarations.push(makeTheme('Color', makeColor(color)));
    }
    if (fontSize) {
      declarations.push(makeTheme('FontSize', makeFontSize(fontSize)));
    }
    if (fontWeight) {
      declarations.push(makeTheme('FontWeight', makeFontWeight(fontWeight)));
    }

    declarations = declarations.filter(e => e !== undefined);
    if (!declarations.length) {
      return;
    }

    waitFor(this._vdom.registerStyle(JSON.stringify(declarations)), (id) => {
      console.info(`Registered style #${id} '${selector}':`, declarations); this._cache = new Map();
      this._rules.set(selector, id);
      this.emit('register-style');
    });
  }
}
