package dto

import "github.com/shopspring/decimal"

type CreateTaskRequest struct {
	Title        string          `json:"title" validate:"required,min=1, max=100"`
	Category     string          `json:"category" validate:"required,oneof=design it-dev text-and-copywriting seo training-and-consulting"`
	SubCategory  string          `json:"sub_category" validate:"required,min=1"`
	Description  string          `json:"description" validate:"required,min=1,max=2000"`
	Requirements []string        `json:"requirements" validate:"max=5,dive,file"`
	DesiredPrice decimal.Decimal `json:"desired_price" validate:"required,dgt=500"`
}
