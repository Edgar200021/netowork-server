package handlers

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/Edgar200021/netowork-server/internal/constants"
	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/service/auth"
	"github.com/Edgar200021/netowork-server/pkg/req"
	"github.com/Edgar200021/netowork-server/pkg/res"
	"github.com/Edgar200021/netowork-server/pkg/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
	"github.com/go-playground/validator/v10"
)

var verifyAccountLimiter = httprate.NewRateLimiter(2, time.Hour*24)

func (h *authHandler) VerifyAccount(w http.ResponseWriter, r *http.Request) {
	if verifyAccountLimiter.RespondOnLimit(w, r, req.ReadUserIP(r)) {
		return
	}

	h.log = h.log.With(slog.String("handler", "verifyAccount"), slog.String("request_id", middleware.GetReqID(r.Context())))

	data, err := req.HandleBody[dto.VerifyAccountRequest](&w, r)
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

	user, sessionKey, err := h.authService.VerifyAccount(r.Context(), data)
	if err != nil {
		if errors.Is(err, auth.ErrUserDoesNotExist) {
			res.ErrorResponse(w, http.StatusBadRequest, "пользователь не найден")
			return
		}

		if errors.Is(err, auth.ErrVerificationTokenDoesNotExist) || errors.Is(err, auth.ErrVerificationTokenExpired) {
			res.ErrorResponse(w, http.StatusBadRequest, "неверный или истекший токен верификации")
			return
		}

		h.log.Error("failed to verify account", sl.Err(err))
		res.InternalServerErrorResponse(w)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     constants.UserSessionCookieName,
		Value:    sessionKey,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	})

	res.SuccessResponse(w, http.StatusOK, user)
}
