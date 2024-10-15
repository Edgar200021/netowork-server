-- Add migration script here

CREATE TABLE verification_tokens(
	id SERIAL PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	token TEXT NOT NULL,
	expires TIMESTAMP NOT NULL
)