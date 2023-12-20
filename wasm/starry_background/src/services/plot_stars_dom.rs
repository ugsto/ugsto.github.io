use rand::{thread_rng, Rng};
use wasm_bindgen::JsCast;

use crate::{
    models::star::{Star, StarClass},
    traits::plot_stars::PlotStars,
    utils::dom::get_document_and_window,
};

pub struct PlotStarsDom;

impl PlotStars for PlotStarsDom {
    fn plot_stars(stars: &[Star], parent: web_sys::Element) {
        let (document, _) = get_document_and_window();

        for star in stars {
            let mut rng = thread_rng();

            let star_element = document
                .create_element("div")
                .expect("Could not create a div element")
                .unchecked_into::<web_sys::HtmlElement>();

            star_element.set_class_name("star");
            let style = format!(
                "width: {}px; height: {}px; position: absolute;",
                star.size, star.size
            );

            let position_style = format!(
                "left: {}%; top: {}%;",
                rng.gen_range(0..100),
                rng.gen_range(0..100)
            );

            star_element
                .set_attribute("style", &(style + &position_style))
                .expect("Failed to set style");

            let color = star_color_by_class(star.class);
            let animation_name = create_twinkle_animation(&document, star.brightness, color);

            star_element
                .style()
                .set_property("animation", &format!("{} 2s infinite", animation_name))
                .expect("Failed to set animation");

            parent
                .append_child(&star_element)
                .expect("Failed to append child");
        }
    }
}

fn star_color_by_class(star_class: StarClass) -> &'static str {
    match star_class {
        StarClass::O => "#9db4ff",
        StarClass::B => "#afc3ff",
        StarClass::A => "#cad8ff",
        StarClass::F => "#fff9f9",
        StarClass::G => "#fff1df",
        StarClass::K => "#ffc690",
        StarClass::M => "#ffbb7b",
    }
}

fn create_twinkle_animation(
    document: &web_sys::Document,
    brightness: f32,
    bright_color: &str,
) -> String {
    let brightness = brightness.round();
    let name = format!("twinkle-{}-{}", brightness, bright_color.replace('#', ""));

    let style = document
        .create_element("style")
        .expect("Could not create a style element")
        .dyn_into::<web_sys::HtmlStyleElement>()
        .expect("Could not cast to HtmlStyleElement");

    let keyframes = format!(
        "@keyframes {} {{
            0%, 100% {{ box-shadow: 0 0 {}px {}; }}
            50% {{ box-shadow: 0 0 {}px {}; }}
        }}",
        name,
        brightness / 20.0,
        bright_color,
        brightness / 50.0,
        bright_color,
    );

    style.set_inner_html(&keyframes);
    document
        .head()
        .expect("No head element")
        .append_child(&style)
        .expect("Failed to append style");

    name
}
