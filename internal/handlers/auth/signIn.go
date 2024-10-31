package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/service/auth"
	"github.com/Edgar200021/netowork-server/internal/utils/response"
	"github.com/Edgar200021/netowork-server/internal/utils/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-playground/validator/v10"
)

func (h *authHandler) SignIn(w http.ResponseWriter, r *http.Request) {
	ctx, _ := context.WithTimeout(r.Context(), time.Second*4)

	h.log = h.log.With(slog.String("handler", "signUp"), slog.String("request_id", middleware.GetReqID(r.Context())))

	var data dto.SignInRequest

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		h.log.Error("failed to decode request body", sl.Err(err))
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

	user, err := h.authService.SignIn(ctx, data)
	if err != nil {
		if errors.Is(err, auth.ErrUserDoesNotExist) || errors.Is(err, auth.ErrAccountNotVerified) || errors.Is(err, auth.ErrInvalidCredentials) {
			response.ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}

		response.InternalServerErrorResponse(w)
		return
	}

	response.SuccessResponse(w, http.StatusOK, user)

}
