use crate::models::star::Star;

pub trait PlotStars {
    fn plot_stars(stars: &[Star], parent: web_sys::Element);
}
