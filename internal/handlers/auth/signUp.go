package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/Edgar200021/netowork-server/internal/dto"
	service "github.com/Edgar200021/netowork-server/internal/service/auth"
	"github.com/Edgar200021/netowork-server/internal/utils/response"
	"github.com/Edgar200021/netowork-server/internal/utils/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-playground/validator/v10"
)

func (h *authHandler) SignUp(w http.ResponseWriter, r *http.Request) {
	ctx, _ := context.WithTimeout(r.Context(), time.Second*4)

	h.log = h.log.With(slog.String("handler", "signUp"), slog.String("request_id", middleware.GetReqID(r.Context())))

	var data dto.CreateUserRequest

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		h.log.Error("Failed to decode request body", sl.Err(err))
		response.InternalServerErrorResponse(w)
		return
	}

	h.log.Info("request body decoded", slog.Any("data", data))

	if err := validator.New(validator.WithRequiredStructEnabled()).Struct(data); err != nil {
		validationErr := err.(validator.ValidationErrors)

		h.log.Error("Invalid request", sl.Err(err))

		response.ValidationErrorResponse(w, validationErr)
		return
	}

	if err := h.authService.SignUp(ctx, data); err != nil {
		if errors.Is(err, service.ErrUserExists) {
			response.ErrorResponse(w, http.StatusBadRequest, "пользователь с таким email уже существует")
			return
		}

		h.log.Error("failed to sign up user", sl.Err(err))
		response.InternalServerErrorResponse(w)

		return
	}

	response.SuccessResponse(w, http.StatusCreated, nil)
}
