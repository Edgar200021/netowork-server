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

var verifyAccountLimiter = httprate.NewRateLimiter(2, time.Hour*24)

func (h *authHandler) VerifyAccount(w http.ResponseWriter, r *http.Request) {
	if verifyAccountLimiter.RespondOnLimit(w, r, request.ReadUserIP(r)) {
		return
	}

	h.log = h.log.With(slog.String("handler", "verifyAccount"), slog.String("request_id", middleware.GetReqID(r.Context())))

	var data dto.VerifyAccountRequest

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		h.log.Error("failed to decode request body", sl.Err(err))
		response.InternalServerErrorResponse(w)
		return
	}

	h.log.Info("request body decoded", slog.Any("data", data))

	if err := validator.New(validator.WithRequiredStructEnabled()).Struct(data); err != nil {
		h.log.Error("Invalid request", sl.Err(err))
		response.ValidationErrorResponse(w, err.(validator.ValidationErrors))
		return
	}

	user, sessionKey, err := h.authService.VerifyAccount(r.Context(), data)
	if err != nil {
		if errors.Is(err, auth.ErrUserDoesNotExist) {
			response.ErrorResponse(w, http.StatusBadRequest, "пользователь не найден")
			return
		}

		if errors.Is(err, auth.ErrVerificationTokenDoesNotExist) || errors.Is(err, auth.ErrVerificationTokenExpired) {
			response.ErrorResponse(w, http.StatusBadRequest, "неверный или истекший токен верификации")
			return
		}

		h.log.Error("failed to verify account", sl.Err(err))
		response.InternalServerErrorResponse(w)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     UserSessionCookieName,
		Value:    sessionKey,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	})

	response.SuccessResponse(w, http.StatusOK, user)
}
