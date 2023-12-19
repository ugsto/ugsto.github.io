pub mod prelude {
    pub use super::traits::{plot_stars::PlotStars, star_iterator::StarIterator};
}

use crate::{models::star::Star, services::random_stars_iterator::RandomStarsIterator};
use prelude::*;
use services::plot_stars_dom::PlotStarsDom;
use wasm_bindgen::prelude::*;

mod models;
mod services;
mod traits;
mod utils;

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn randomStars(num_stars: usize) -> Vec<Star> {
    RandomStarsIterator::new(num_stars).stars().collect()
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn plotStars(stars: Vec<Star>, parent: wasm_bindgen::JsValue) {
    let parent = parent.unchecked_into::<web_sys::Element>();

    PlotStarsDom::plot_stars(&stars, parent)
}
