package middlewares

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/Edgar200021/netowork-server/internal/constants"
	"github.com/Edgar200021/netowork-server/internal/service/auth"
	"github.com/Edgar200021/netowork-server/internal/types"
	"github.com/Edgar200021/netowork-server/pkg/res"
	"github.com/Edgar200021/netowork-server/pkg/sl"
	"github.com/go-chi/chi/v5/middleware"
)

func (m *Middleware) Auth(next http.HandlerFunc) http.HandlerFunc {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		m.log = m.log.With(slog.String("middleware", "auth"), slog.String("request_id", middleware.GetReqID(r.Context())))

		sessionKey, err := r.Cookie(constants.UserSessionCookieName)

		if err != nil {
			if errors.Is(err, http.ErrNoCookie) {
				m.log.Error("user session cookie not found", sl.Err(err))
				res.UnauthorizedResponse(w)
				return
			}

			m.log.Error("failed to read user session cookie", sl.Err(err))
			res.InternalServerErrorResponse(w)
			return
		}

		sessionUserStr, err := m.redisClient.Get(r.Context(), sessionKey.Value)
		if err != nil {
			m.log.Error("failed to get user session from redis", sl.Err(err))
			res.InternalServerErrorResponse(w)
			return
		}

		if sessionUserStr == "" {
			m.log.Error("user not found in redis")
			res.UnauthorizedResponse(w)
			return
		}

		var sessionUser types.SessionUser
		if err := json.Unmarshal([]byte(sessionUserStr), &sessionUser); err != nil {
			m.log.Error("failed to unmarshal user session from redis", sl.Err(err))
			res.InternalServerErrorResponse(w)
			return
		}

		user, err := m.userRepository.GetById(r.Context(), sessionUser.Id)
		if err != nil {
			m.log.Error("failed to get user from database", sl.Err(err))
			res.InternalServerErrorResponse(w)
			return
		}

		if user == nil {
			m.log.Error("user not found in database")

			if err := m.redisClient.Del(r.Context(), sessionKey.Value); err != nil {
				m.log.Error("failed to delete user session from redis", sl.Err(err))
				res.InternalServerErrorResponse(w)
				return
			}

			res.UnauthorizedResponse(w)
			return
		}

		if time.Now().UTC().Before(sessionUser.Expires) {
			ctx := context.WithValue(r.Context(), CtxUserKey, user)

			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		m.log.Info("refresh user session")

		if err := m.redisClient.Del(r.Context(), sessionKey.Value); err != nil {
			m.log.Error("failed to delete user session from redis", sl.Err(err))
			res.InternalServerErrorResponse(w)
			return
		}

		newSessionKey, error := auth.StoreUserSession(r.Context(), m.applicationConfig, m.redisClient, user)
		if error != nil {
			m.log.Error("failed to store user session in redis", sl.Err(error))
			res.InternalServerErrorResponse(w)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     constants.UserSessionCookieName,
			Value:    newSessionKey,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
			Path:     "/",
		})

		ctx := context.WithValue(r.Context(), CtxUserKey, user)

		next.ServeHTTP(w, r.WithContext(ctx))

	})
}
