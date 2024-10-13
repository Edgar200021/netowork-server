-- Add migration script here
CREATE INDEX index_email_on_users ON users (email);