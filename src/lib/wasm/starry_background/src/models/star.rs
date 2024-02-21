use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, PartialEq, Copy, Clone)]
pub enum StarClass {
    O,
    B,
    A,
    F,
    G,
    K,
    M,
}

#[wasm_bindgen]
#[derive(Debug)]
pub struct Star {
    pub class: StarClass,
    pub brightness: f32,
    pub size: u8,
}
