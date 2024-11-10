package models

import "github.com/shopspring/decimal"

type TaskCategory string

const (
	Design                TaskCategory = "design"
	ITDev                 TaskCategory = "it-dev"
	TextsAndCopywriting   TaskCategory = "text-and-copywriting"
	Seo                   TaskCategory = "seo"
	TrainingAndConsulting TaskCategory = "training-and-consulting"
)

type Task struct {
	ID           int             `db:"id" json:"id"`
	Title        string          `db:"title" json:"title"`
	Category     TaskCategory    `db:"category" json:"category"`
	SubCategory  string          `db:"sub_category" json:"sub_category"`
	Description  string          `db:"description" json:"description"`
	Requirements []string        `db:"requirements" json:"requirements"`
	DesiredPrice decimal.Decimal `db:"desired_price" json:"desired_price"`
}
