package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/Edgar200021/netowork-server/internal/dto"
	"github.com/Edgar200021/netowork-server/internal/utils/response"
	"github.com/Edgar200021/netowork-server/internal/utils/sl"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-playground/validator/v10"
)

func (h *authHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	h.log = h.log.With(slog.String("handler", "resetPassword"), slog.String("request_id", middleware.GetReqID(r.Context())))

	var data dto.ResetPasswordRequest

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		h.log.Error("failed to decode request body", sl.Err(err))
		response.InternalServerErrorResponse(w)
		return
	}

	if err := validator.New(validator.WithRequiredStructEnabled()).Struct(data); err != nil {
		h.log.Error("Invalid request", sl.Err(err))
		response.ValidationErrorResponse(w, err.(validator.ValidationErrors))
		return
	}

	if err := h.authService.ResetPassword(r.Context(), data); err != nil {

	}

}
