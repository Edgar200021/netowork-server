package handlers

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/Edgar200021/netowork-server/internal/dto"
	service "github.com/Edgar200021/netowork-server/internal/service/auth"
	"github.com/Edgar200021/netowork-server/pkg/req"
	"github.com/Edgar200021/netowork-server/pkg/res"
	"github.com/Edgar200021/netowork-server/pkg/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
	"github.com/go-playground/validator/v10"
)

var signUpRateLimiter = httprate.NewRateLimiter(10, time.Minute*2)

func (h *authHandler) SignUp(w http.ResponseWriter, r *http.Request) {

	if signUpRateLimiter.RespondOnLimit(w, r, req.ReadUserIP(r)) {
		return
	}

	h.log = h.log.With(slog.String("handler", "signUp"), slog.String("request_id", middleware.GetReqID(r.Context())))

	data, err := req.HandleBody[dto.CreateUserRequest](&w, r)
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

	if err := h.authService.SignUp(r.Context(), data); err != nil {
		if errors.Is(err, service.ErrUserExists) {
			res.ErrorResponse(w, http.StatusBadRequest, "пользователь с таким email уже существует")
			return
		}

		h.log.Error("failed to sign up user", sl.Err(err))
		res.InternalServerErrorResponse(w)

		return
	}

	res.SuccessResponse(w, http.StatusCreated, nil)
}
