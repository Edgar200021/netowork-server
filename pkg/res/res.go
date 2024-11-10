package res

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

func WriteJson(w http.ResponseWriter, status int, data interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	return json.NewEncoder(w).Encode(data)
}

func SuccessResponse(w http.ResponseWriter, status int, data interface{}) error {
	response := map[string]interface{}{
		"status": "success",
		"data":   data,
	}

	return WriteJson(w, status, response)
}

func ErrorResponse(w http.ResponseWriter, status int, message string) error {
	response := map[string]string{
		"status":  "error",
		"message": message,
	}

	return WriteJson(w, status, response)
}

func ValidationErrorResponse(w http.ResponseWriter, errors validator.ValidationErrors) error {
	errorsResponse := make(map[string]string)
	response := map[string]interface{}{
		"status": "error",
		"errors": errorsResponse,
	}

	for _, err := range errors {
		field := strings.ToLower(err.Field())
		switch err.ActualTag() {
		case "required":
			errorsResponse[field] = fmt.Sprintf("%s не может быть пустым", field)
		case "email":
			errorsResponse[field] = "Некорректный email"
		case "min":
			errorsResponse[field] = fmt.Sprintf("%s должен содержать не менее %s символов", field, err.Param())
		case "max":
			errorsResponse[field] = fmt.Sprintf("%s должен содержать не более %s символов", field, err.Param())
		case "oneof":
			errorsResponse[field] = fmt.Sprintf("%s должен быть одним из %s", field, err.Param())
		case "excludesall":
			errorsResponse[field] = fmt.Sprintf("%s не должен содержать %s", field, err.Param())
		case "eqfield":
			if err.Param() == "Password" {
				errorsResponse["password_confirm"] = fmt.Sprintf("password_confirm должен быть равен %s", strings.ToLower(err.Param()))
			} else {
				errorsResponse[field] = fmt.Sprintf("%s должен быть равен %s", field, strings.ToLower(err.Param()))
			}
		}
	}

	return WriteJson(w, http.StatusBadRequest, response)
}

func InternalServerErrorResponse(w http.ResponseWriter) error {
	response := map[string]interface{}{
		"status": "error",
		"error":  "Что-то пошло не так",
	}

	return WriteJson(w, http.StatusInternalServerError, response)
}

func UnauthorizedResponse(w http.ResponseWriter) error {
	response := map[string]interface{}{
		"status": "error",
		"error":  "Не авторизован",
	}
	return WriteJson(w, http.StatusUnauthorized, response)
}
