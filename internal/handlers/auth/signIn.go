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

var signInRateLimiter = httprate.NewRateLimiter(5, time.Minute*2)

func (h *authHandler) SignIn(w http.ResponseWriter, r *http.Request) {
	if signInRateLimiter.RespondOnLimit(w, r, req.ReadUserIP(r)) {
		return
	}

	h.log = h.log.With(slog.String("handler", "signUp"), slog.String("request_id", middleware.GetReqID(r.Context())))

	data, err := req.HandleBody[dto.SignInRequest](&w, r)
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

	user, sessionKey, err := h.authService.SignIn(r.Context(), data)
	if err != nil {
		if errors.Is(err, auth.ErrUserDoesNotExist) || errors.Is(err, auth.ErrAccountNotVerified) || errors.Is(err, auth.ErrInvalidCredentials) {
			res.ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}

		h.log.Error("failed to sign in user", sl.Err(err))

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
