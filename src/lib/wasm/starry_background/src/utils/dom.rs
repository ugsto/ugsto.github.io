use web_sys::{Document, Window};

pub fn get_document_and_window() -> (Document, Window) {
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");

    (document, window)
}
