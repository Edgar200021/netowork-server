-- Add migration script here

ALTER TABLE users DROP COLUMN password_reset_token, DROP COLUMN password_reset_expires;

CREATE TABLE password_reset_tokens(
	id SERIAL PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	token TEXT NOT NULL,
	expires TIMESTAMP NOT NULL
);