use tracing::Level;

pub fn init_subscriber() {
    tracing_subscriber::fmt()
        .json()
        .with_current_span(false)
        //.pretty()
        .with_max_level(Level::DEBUG)
        .with_target(false)
        .with_thread_names(true)
        .init();
}
