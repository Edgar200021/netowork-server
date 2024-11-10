package handlers

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/service/auth"
	"github.com/Edgar200021/netowork-server/pkg/req"
	"github.com/Edgar200021/netowork-server/pkg/res"
	"github.com/Edgar200021/netowork-server/pkg/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-playground/validator/v10"
)

func (h *authHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	h.log = h.log.With(slog.String("handler", "resetPassword"), slog.String("request_id", middleware.GetReqID(r.Context())))

	data, err := req.HandleBody[dto.ResetPasswordRequest](&w, r)
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

	if err := h.authService.ResetPassword(r.Context(), data); err != nil {
		if errors.Is(err, auth.ErrPasswordResetTokenDoesNotExist) || errors.Is(err, auth.ErrPasswordResetTokenExpired) {
			res.ErrorResponse(w, http.StatusBadRequest, "неверный или истекший токен сброса пароля")
			return
		}

		if errors.Is(err, auth.ErrUserDoesNotExist) {
			res.ErrorResponse(w, http.StatusBadRequest, "пользователь не найден")
			return
		}

		h.log.Error("failed to reset password", sl.Err(err))
		res.InternalServerErrorResponse(w)
		return
	}

	res.SuccessResponse(w, http.StatusOK, "пароль успешно сброшен")

}
