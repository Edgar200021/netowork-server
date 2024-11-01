package handlers

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/service/auth"
	"github.com/Edgar200021/netowork-server/internal/utils/request"
	"github.com/Edgar200021/netowork-server/internal/utils/response"
	"github.com/Edgar200021/netowork-server/internal/utils/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
	"github.com/go-playground/validator/v10"
)

var forgotPasswordRateLimiter = httprate.NewRateLimiter(5, time.Hour*24)

func (h *authHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {

	if forgotPasswordRateLimiter.RespondOnLimit(w, r, request.ReadUserIP(r)) {
		return
	}

	h.log = h.log.With(slog.String("handler", "forgotPassword"), slog.String("request_id", middleware.GetReqID(r.Context())))

	var data dto.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		h.log.Error("failed to decode request body", sl.Err(err))
		response.InternalServerErrorResponse(w)
		return
	}

	if err := validator.New(validator.WithRequiredStructEnabled()).Struct(data); err != nil {
		h.log.Error("invalid request", sl.Err(err))
		response.ValidationErrorResponse(w, err.(validator.ValidationErrors))
		return
	}

	if err := h.authService.ForgotPassword(r.Context(), data); err != nil {
		if errors.Is(err, auth.ErrUserDoesNotExist) {
			response.ErrorResponse(w, http.StatusBadRequest, "пользователь не найден")
			return
		}
		response.InternalServerErrorResponse(w)
		return
	}

	response.SuccessResponse(w, http.StatusOK, nil)
}
