package req

import (
	"github.com/go-playground/validator/v10"
)

func IsValid[T any](data T) validator.ValidationErrors {
	if err := validator.New(validator.WithRequiredStructEnabled()).Struct(data); err != nil {
		return err.(validator.ValidationErrors)
	}

	return nil
}
