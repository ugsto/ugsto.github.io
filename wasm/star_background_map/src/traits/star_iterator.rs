use crate::models::star::Star;

pub trait StarIterator {
    fn stars(&self) -> Box<dyn Iterator<Item = Star>>;
}
