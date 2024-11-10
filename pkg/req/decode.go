package req

import (
	"encoding/json"
	"io"
)

func Decode[T any](r io.Reader) (*T, error) {
	var data T

	if err := json.NewDecoder(r).Decode(&data); err != nil {
		return nil, nil
	}
	return &data, nil
}
