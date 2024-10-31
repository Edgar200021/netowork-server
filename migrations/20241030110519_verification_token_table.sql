-- +goose Up
-- +goose StatementBegin
CREATE TABLE verification_token(
	id SERIAL PRIMARY KEY,
	user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	token TEXT NOT NULL,
	expires TIMESTAMP NOT NULL
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE verification_token;
-- +goose StatementEnd
