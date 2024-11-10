package handlers

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/service/auth"
	"github.com/Edgar200021/netowork-server/pkg/req"
	"github.com/Edgar200021/netowork-server/pkg/res"
	"github.com/Edgar200021/netowork-server/pkg/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
	"github.com/go-playground/validator/v10"
)

var forgotPasswordRateLimiter = httprate.NewRateLimiter(5, time.Hour*24)

func (h *authHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {

	if forgotPasswordRateLimiter.RespondOnLimit(w, r, req.ReadUserIP(r)) {
		return
	}

	h.log = h.log.With(slog.String("handler", "forgotPassword"), slog.String("request_id", middleware.GetReqID(r.Context())))

	data, err := req.HandleBody[dto.ForgotPasswordRequest](&w, r)
	if err != nil {
		if errors.Is(err, err.(validator.ValidationErrors)) {
			h.log.Error("invalid request", sl.Err(err))
			res.ValidationErrorResponse(w, err.(validator.ValidationErrors))
			return
		}

		h.log.Error("failed to decode request body", sl.Err(err))
		res.InternalServerErrorResponse(w)
		return
	}

	h.log.Info("request body decoded", slog.Any("data", data))

	if err := h.authService.ForgotPassword(r.Context(), data); err != nil {
		if errors.Is(err, auth.ErrUserDoesNotExist) {
			res.ErrorResponse(w, http.StatusBadRequest, "пользователь не найден")
			return
		}
		res.InternalServerErrorResponse(w)
		return
	}

	res.SuccessResponse(w, http.StatusOK, nil)
}
