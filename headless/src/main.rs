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

#[macro_use]
extern crate lazy_static;
extern crate rsx_native_renderer;
extern crate rsx_primitives;
extern crate serde;
extern crate serde_json;
extern crate ws;

#[macro_use]
mod macros;

use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::SystemTime;

use ws::{listen, CloseCode, Handler, Handshake, Message, Result, Sender};

use rsx_native_renderer::glutin::Event;
use rsx_native_renderer::types::Runner;
use rsx_native_renderer::webrender::api::{BuiltDisplayList, LayoutSize, PipelineId, RenderApi, ResourceUpdates};
use rsx_primitives::build::types::DisplayListBuilder;
use rsx_primitives::compare::export as Diff;
use rsx_primitives::prelude::{DOMTree, FileCache, FontCache, ImageCache, ResourceGroup, ShapedText};
use rsx_primitives::rsx_dom::types::DOMText;
use rsx_primitives::rsx_layout::types::LayoutBoundingClientRect;
use rsx_primitives::rsx_resources::fonts::types::EncodedFont;
use rsx_primitives::rsx_shared::traits::{
    TEncodedFont,
    TFontCache,
    TFontKeysAPI,
    TImageCache,
    TImageKeysAPI,
    TResourceGroup,
    TRunner,
    TRuntime
};
use rsx_primitives::rsx_stylesheet::types::{BorderStyle, Color};
use rsx_primitives::traits::TDisplayListBuilder;

lazy_static! {
    static ref REMOTE_RESOURCES: Mutex<Vec<RemoteResource>> = Default::default();
    static ref REMOTE_DISPLAY_LIST: Mutex<Vec<RemoteDisplayItem>> = Default::default();
    static ref FONT_FAMILY_NAME_MAP: Mutex<HashMap<u64, String>> = Default::default();
    static ref FONT_SIZE_MAP: Mutex<HashMap<u64, u32>> = Default::default();
    static ref SHOULD_SET_WINDOW_POSITION: Mutex<Option<(i32, i32)>> = Default::default();
    static ref SHOULD_SET_WINDOW_SIZE: Mutex<Option<(u32, u32)>> = Default::default();
    static ref SHOULD_REDRAW: AtomicBool = Default::default();
}

pub enum RemoteResource {
    Font(RemoteFontResource),
    FontInstance(RemoteFontInstanceResource),
    Image(RemoteImageResource)
}

pub struct RemoteFontResource {
    key: u64,
    data_uri: String
}

pub struct RemoteFontInstanceResource {
    key: u64,
    instance_key: u64,
    size: u32
}

pub struct RemoteImageResource {
    // TODO
}

pub enum RemoteDisplayItem {
    Rect(RemoteRectItem),
    Border(RemoteBorderItem),
    Image(RemoteImageItem),
    Text(RemoteTextItem)
}

pub struct RemoteRectItem {
    rect: LayoutBoundingClientRect,
    color: Color
}

pub struct RemoteBorderItem {
    rect: LayoutBoundingClientRect,
    colors: [Color; 4],
    styles: [BorderStyle; 4],
    widths: [u32; 4]
}

pub struct RemoteImageItem {
    // TODO
}

pub struct RemoteTextItem {
    rect: LayoutBoundingClientRect,
    color: Color,
    text: String,
    font_key: u64,
    font_instance_key: u64
}

impl RemoteDisplayItem {
    pub fn as_rect(&mut self) -> Option<&mut RemoteRectItem> {
        if let &mut RemoteDisplayItem::Rect(ref mut item) = self {
            Some(item)
        } else {
            None
        }
    }

    pub fn as_border(&mut self) -> Option<&mut RemoteBorderItem> {
        if let &mut RemoteDisplayItem::Border(ref mut item) = self {
            Some(item)
        } else {
            None
        }
    }

    pub fn as_image(&mut self) -> Option<&mut RemoteImageItem> {
        if let &mut RemoteDisplayItem::Image(ref mut item) = self {
            Some(item)
        } else {
            None
        }
    }

    pub fn as_text(&mut self) -> Option<&mut RemoteTextItem> {
        if let &mut RemoteDisplayItem::Text(ref mut item) = self {
            Some(item)
        } else {
            None
        }
    }
}

struct Server {
    _out: Sender
}

impl Server {
    fn new(out: Sender) -> Server {
        Server { _out: out }
    }
}

impl Handler for Server {
    fn on_open(&mut self, _: Handshake) -> Result<()> {
        Ok(())
    }

    fn on_message(&mut self, msg: Message) -> Result<()> {
        debug_assert!(msg.is_text());

        // let start = SystemTime::now();

        let body = msg.into_text().unwrap();
        let mut parsed: serde_json::Value = serde_json::from_str(&body).unwrap();

        if let Some(_) = parsed.get("clear") {
            receive_clear();
        }
        if let Some(message) = parsed.get_mut("position") {
            receive_position(message.take());
        }
        if let Some(message) = parsed.get_mut("size") {
            receive_size(message.take());
        }
        if let Some(message) = parsed.get_mut("resources") {
            receive_resources(message.take());
        }
        if let Some(message) = parsed.get_mut("render") {
            receive_render(message.take());
        }

        // let duration = SystemTime::now().duration_since(start).unwrap();
        // let elapsed = duration.as_secs() * 1000 + duration.subsec_nanos() as u64 / 1000000;
        // if elapsed > 1 {
        //     println!("Overhead: {}ms for `{}..`", elapsed, &body[..16]);
        // }

        Ok(())
    }

    fn on_close(&mut self, _: CloseCode, _: &str) {
        receive_clear();
    }
}

struct Runtime {
    resources: ResourceGroup
}

impl TRuntime for Runtime {
    type RootRendererAPI = Rc<RenderApi>;
    type DOMResources = ResourceGroup;
    type DOMTree = DOMTree;
    type VirtualEventMetadata = (Event,);
    type ReflowMetadata = (PipelineId, LayoutSize);
    type BuiltDisplayList = BuiltDisplayList;
    type ResourceUpdates = ResourceUpdates;

    fn new<S, R>(api: &Self::RootRendererAPI, _: S, _: R) -> Self
    where
        S: Fn(&mut Self::DOMResources),
        R: Fn() -> Self::DOMTree
    {
        let files = FileCache::new().unwrap();
        let images = ImageCache::new(TImageKeysAPI::new(Rc::clone(api))).unwrap();
        let fonts = FontCache::new(TFontKeysAPI::new(Rc::clone(api))).unwrap();
        let resources = ResourceGroup::new(files, images, fonts);

        Runtime { resources }
    }

    fn should_set_window_position(&mut self) -> Option<(i32, i32)> {
        SHOULD_SET_WINDOW_POSITION.lock().unwrap().take()
    }

    fn should_set_window_size(&mut self) -> Option<(u32, u32)> {
        SHOULD_SET_WINDOW_SIZE.lock().unwrap().take()
    }

    fn should_redraw(&mut self) -> bool {
        SHOULD_REDRAW.swap(false, Ordering::Relaxed)
    }

    fn handle_event(&mut self, _: Self::VirtualEventMetadata) -> bool {
        false
    }

    fn take_resource_updates(&mut self) -> Self::ResourceUpdates {
        let mut remote_resources = REMOTE_RESOURCES.lock().unwrap();

        for resource in remote_resources.drain(..) {
            match resource {
                RemoteResource::Font(font) => {
                    let mut fonts = self.resources.fonts();
                    let font_name = format!("{}", font.key);
                    let encoded = EncodedFont::from_data_uri(font.data_uri).unwrap();
                    fonts.add_font(&font_name, &encoded, 0);

                    let mut font_family_name_map = FONT_FAMILY_NAME_MAP.lock().unwrap();
                    let family_name = fonts.get_family_name(font_name).unwrap();
                    font_family_name_map.insert(font.key, family_name);
                }
                RemoteResource::FontInstance(font_instance) => {
                    let fonts = self.resources.fonts();
                    let font_name = format!("{}", font_instance.key);
                    let family_name = fonts.get_family_name(font_name).unwrap();
                    let size = font_instance.size;
                    fonts.get_font_with_size(family_name, size);

                    let mut font_size_map = FONT_SIZE_MAP.lock().unwrap();
                    font_size_map.insert(font_instance.instance_key, size);
                }
                _ => unimplemented!()
            }
        }

        let images = self.resources.images().take_resource_updates();
        let fonts = self.resources.fonts().take_resource_updates();
        let mut updates = ResourceUpdates::new();
        updates.merge(images);
        updates.merge(fonts);
        updates
    }

    fn generate_display_list(&mut self, (pipeline_id, layout_size): Self::ReflowMetadata) -> Self::BuiltDisplayList {
        // let start = SystemTime::now();

        let remote_display_list = REMOTE_DISPLAY_LIST.lock().unwrap();
        let font_family_name_map = FONT_FAMILY_NAME_MAP.lock().unwrap();
        let font_size_map = FONT_SIZE_MAP.lock().unwrap();

        let mut builder = DisplayListBuilder::new(pipeline_id, layout_size);

        for display_item in remote_display_list.iter() {
            match display_item {
                &RemoteDisplayItem::Rect(ref rect_display_item) => {
                    TDisplayListBuilder::push_rect(
                        &mut builder,
                        rect_display_item.rect,
                        rect_display_item.color
                    );
                }
                &RemoteDisplayItem::Border(ref border_display_item) => {
                    TDisplayListBuilder::push_border(
                        &mut builder,
                        border_display_item.rect,
                        border_display_item.widths,
                        border_display_item.colors,
                        border_display_item.styles
                    );
                }
                &RemoteDisplayItem::Text(ref text_display_item) => {
                    let font_family_name = font_family_name_map
                        .get(&text_display_item.font_key)
                        .unwrap();

                    let font_size = font_size_map
                        .get(&text_display_item.font_instance_key)
                        .unwrap();

                    let font_instance = self.resources
                        .fonts()
                        .get_font_with_size(font_family_name, *font_size)
                        .unwrap();

                    let glyph_store = self.resources
                        .fonts()
                        .shape_text_h(&font_instance, &text_display_item.text)
                        .unwrap();

                    TDisplayListBuilder::push_text(
                        &mut builder,
                        text_display_item.rect,
                        text_display_item.color,
                        &ShapedText::from(glyph_store),
                        &DOMText::from("")
                    );
                }
                _ => unimplemented!()
            }
        }

        let built = builder.serialize();

        // let duration = SystemTime::now().duration_since(start).unwrap();
        // let elapsed = duration.as_secs() * 1000 + duration.subsec_nanos() as u64 / 1000000;
        // if elapsed > 5 {
        //     println!("Wasted: {}ms", elapsed);
        // }

        built
    }
}

fn receive_clear() {
    let mut remote_resources = REMOTE_RESOURCES.lock().unwrap();
    let mut remote_display_list = REMOTE_DISPLAY_LIST.lock().unwrap();
    remote_resources.clear();
    remote_display_list.clear();
    SHOULD_REDRAW.swap(true, Ordering::Relaxed);
}

fn receive_position(parsed: serde_json::Value) {
    *SHOULD_SET_WINDOW_POSITION.lock().unwrap() = Some((
        parsed.get(0).unwrap().as_i64().unwrap() as i32,
        parsed.get(1).unwrap().as_i64().unwrap() as i32
    ));
}

fn receive_size(parsed: serde_json::Value) {
    *SHOULD_SET_WINDOW_SIZE.lock().unwrap() = Some((
        parsed.get(0).unwrap().as_u64().unwrap() as u32,
        parsed.get(1).unwrap().as_u64().unwrap() as u32
    ));
}

fn receive_resources(mut parsed: serde_json::Value) {
    let mut remote_resources = REMOTE_RESOURCES.lock().unwrap();

    for diff in parsed.as_array_mut().unwrap() {
        if let Some(update) = diff.get_mut("AddFont") {
            let key = update.get("key").unwrap().as_u64().unwrap();
            let data_uri = take_string(update.get_mut("data_uri").unwrap().take()).unwrap();
            remote_resources.push(RemoteResource::Font(RemoteFontResource {
                key,
                data_uri: data_uri.to_string()
            }));
            continue;
        }
        if let Some(update) = diff.get("AddFontInstance") {
            let key = update.get("key").unwrap().as_u64().unwrap();
            let instance_key = update.get("instance_key").unwrap().as_u64().unwrap();
            let size = update.get("size").unwrap().as_u64().unwrap();
            remote_resources.push(RemoteResource::FontInstance(RemoteFontInstanceResource {
                key,
                instance_key,
                size: size as u32
            }));
            continue;
        }
        unimplemented!()
    }
}

fn receive_render(mut parsed: serde_json::Value) {
    let mut remote_display_list = REMOTE_DISPLAY_LIST.lock().unwrap();

    for diff in parsed.as_array_mut().unwrap() {
        if let Some(update) = diff.get_mut(Diff::UPDATE_SELF_KEY) {
            let i = update[0].as_u64().unwrap() as usize;
            let changes = &mut update[1];

            if remote_display_list.len() == 0 {
                // Server started after the page was loaded in host.
                return;
            }

            for change in changes.as_array_mut().unwrap() {
                if let Some(specific) = change.get_mut(Diff::TEXT_UPDATE_KEY) {
                    if let Some(text_content) = specific.get_mut(Diff::TEXT_UPDATE_CHANGE_CONTENT_KEY) {
                        remote_display_list[i].as_text().unwrap().text = take_string(text_content.take()).unwrap();
                        continue;
                    }
                }
                if let Some(specific) = change.get_mut(Diff::BOUNDS_UPDATE_KEY) {
                    if let Some(left) = specific.get_mut(Diff::BOUNDS_UPDATE_CHANGE_X_KEY) {
                        remote_display_list[i].as_rect().unwrap().rect.position.left = left.as_u64().unwrap() as u32;
                        continue;
                    }
                    if let Some(top) = specific.get_mut(Diff::BOUNDS_UPDATE_CHANGE_Y_KEY) {
                        remote_display_list[i].as_rect().unwrap().rect.position.top = top.as_u64().unwrap() as u32;
                        continue;
                    }
                    if let Some(width) = specific.get_mut(Diff::BOUNDS_UPDATE_CHANGE_WIDTH_KEY) {
                        remote_display_list[i].as_rect().unwrap().rect.size.width = width.as_u64().unwrap() as u32;
                        continue;
                    }
                    if let Some(height) = specific.get_mut(Diff::BOUNDS_UPDATE_CHANGE_HEIGHT_KEY) {
                        remote_display_list[i].as_rect().unwrap().rect.size.height = height.as_u64().unwrap() as u32;
                        continue;
                    }
                }
            }
            continue;
        }
        if let Some(update) = diff.get_mut(Diff::ADD_RECT_KEY) {
            remote_display_list.push(RemoteDisplayItem::Rect(RemoteRectItem {
                rect: get_bounding_client_rect(update),
                color: get_color(update)
            }));
            continue;
        }
        if let Some(update) = diff.get_mut(Diff::ADD_BORDER_KEY) {
            remote_display_list.push(RemoteDisplayItem::Border(RemoteBorderItem {
                rect: get_bounding_client_rect(update),
                colors: get_border_colors(update),
                styles: get_border_styles(update),
                widths: get_border_widths(update)
            }));
            continue;
        }
        if let Some(update) = diff.get_mut(Diff::ADD_TEXT_KEY) {
            remote_display_list.push(RemoteDisplayItem::Text(RemoteTextItem {
                rect: get_bounding_client_rect(update),
                color: get_color(update),
                text: get_source_text(update),
                font_key: get_font_key(update).unwrap(),
                font_instance_key: get_font_instance_key(update).unwrap()
            }));
            continue;
        }
        unimplemented!()
    }

    SHOULD_REDRAW.swap(true, Ordering::Relaxed);
}

fn take_string(value: serde_json::Value) -> Option<String> {
    if let serde_json::Value::String(string) = value {
        Some(string)
    } else {
        None
    }
}

fn get_bounding_client_rect(value: &serde_json::Value) -> LayoutBoundingClientRect {
    let bounds = value.get("bounds").unwrap();
    let position = bounds.get("position").unwrap();
    let size = bounds.get("size").unwrap();
    let left = position.get("left").unwrap().as_u64().unwrap() as u32;
    let top = position.get("top").unwrap().as_u64().unwrap() as u32;
    let width = size.get("width").unwrap().as_u64().unwrap() as u32;
    let height = size.get("height").unwrap().as_u64().unwrap() as u32;
    LayoutBoundingClientRect::new(left, top, width, height)
}

fn get_color(value: &serde_json::Value) -> Color {
    let display = value.get("display").unwrap();
    let color = display.get("color").unwrap();
    let red = color.get("red").unwrap().as_u64().unwrap() as u8;
    let green = color.get("green").unwrap().as_u64().unwrap() as u8;
    let blue = color.get("blue").unwrap().as_u64().unwrap() as u8;
    let alpha = color.get("alpha").unwrap().as_u64().unwrap() as u8;
    Color::new([red, green, blue, alpha])
}

fn get_border_color(value: &serde_json::Value, index: usize) -> Color {
    let display = value.get("display").unwrap();
    let color = &display.get("colors").unwrap()[index];
    let red = color.get("red").unwrap().as_u64().unwrap() as u8;
    let green = color.get("green").unwrap().as_u64().unwrap() as u8;
    let blue = color.get("blue").unwrap().as_u64().unwrap() as u8;
    let alpha = color.get("alpha").unwrap().as_u64().unwrap() as u8;
    Color::new([red, green, blue, alpha])
}

fn get_border_style(_value: &serde_json::Value, _index: usize) -> BorderStyle {
    // TODO
    BorderStyle::Solid
}

fn get_border_width(_value: &serde_json::Value, _index: usize) -> u32 {
    // TODO
    1
}

fn get_border_colors(value: &serde_json::Value) -> [Color; 4] {
    [
        get_border_color(value, 0),
        get_border_color(value, 1),
        get_border_color(value, 2),
        get_border_color(value, 3),
    ]
}

fn get_border_styles(value: &serde_json::Value) -> [BorderStyle; 4] {
    [
        get_border_style(value, 0),
        get_border_style(value, 1),
        get_border_style(value, 2),
        get_border_style(value, 3),
    ]
}

fn get_border_widths(value: &serde_json::Value) -> [u32; 4] {
    [
        get_border_width(value, 0),
        get_border_width(value, 1),
        get_border_width(value, 2),
        get_border_width(value, 3),
    ]
}

fn get_source_text(value: &serde_json::Value) -> String {
    let display = value.get("display").unwrap();
    let source_text = display.get("source_text").unwrap().as_array().unwrap();
    source_text
        .iter()
        .filter_map(|v| v.get("Owned").or(v.get("Static")))
        .filter_map(|v| v.as_str())
        .collect::<String>()
}

fn get_font_key(value: &serde_json::Value) -> Option<u64> {
    let display = value.get("display").unwrap();
    let shaped_text = &display.get("shaped_text").unwrap().as_array().unwrap()[0];
    shaped_text.get("font_key").unwrap().as_u64()
}

fn get_font_instance_key(value: &serde_json::Value) -> Option<u64> {
    let display = value.get("display").unwrap();
    let shaped_text = &display.get("shaped_text").unwrap().as_array().unwrap()[0];
    shaped_text.get("font_instance_key").unwrap().as_u64()
}

fn main() {
    thread::spawn(move || listen("127.0.0.1:6767", Server::new).unwrap());
    Runner::run(|api| Runtime::new(api, empty_setup!(), empty_render!()));
}
