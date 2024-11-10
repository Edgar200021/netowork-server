package handlers

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/Edgar200021/netowork-server/internal/constants"
	"github.com/Edgar200021/netowork-server/internal/middlewares"
	"github.com/Edgar200021/netowork-server/internal/models"
	"github.com/Edgar200021/netowork-server/pkg/res"
	"github.com/Edgar200021/netowork-server/pkg/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
)

var logoutRateLimiter = httprate.NewRateLimiter(10, time.Hour*24)

func (h *authHandler) Logout(w http.ResponseWriter, r *http.Request) {
	h.log = h.log.With(slog.String("handler", "logout"), slog.String("request_id", middleware.GetReqID(r.Context())))

	user := r.Context().Value(middlewares.CtxUserKey).(*models.User)
	if user == nil {
		h.log.Error("user not found in context")
		res.UnauthorizedResponse(w)
		return
	}

	sessionKey, err := r.Cookie(constants.UserSessionCookieName)
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			h.log.Error("user session cookie not found", sl.Err(err))
			res.UnauthorizedResponse(w)
			return
		}

		h.log.Error("failed to read user session cookie", sl.Err(err))
		res.InternalServerErrorResponse(w)
		return
	}

	if err := h.authService.Logout(r.Context(), sessionKey.Value); err != nil {
		h.log.Error("failed to logout user", sl.Err(err))
		res.InternalServerErrorResponse(w)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     constants.UserSessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   0,
		Secure:   true,
		HttpOnly: true,
	})

	res.SuccessResponse(w, http.StatusNoContent, nil)
}
