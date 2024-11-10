-- +goose Up
-- +goose StatementBegin
CREATE TABLE task (
	id SERIAL PRIMARY KEY,
	creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	category TEXT NOT NULL,
	sub_category TEXT NOT NULL,
	description TEXT NOT NULL,
	requirements TEXT[],
	desired_price DECIMAL(7,2) NOT NULL
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE task;
-- +goose StatementEnd
