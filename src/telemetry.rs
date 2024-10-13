use tracing::Level;

pub fn init_subscriber() {
    tracing_subscriber::fmt()
        .json()
        .with_max_level(Level::TRACE)
        .with_target(false)
        .with_current_span(false)
        .with_thread_names(true)
        .init();
}
