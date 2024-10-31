package token

import (
	"crypto/rand"
	"encoding/hex"
)

func GenerateToken(length uint) (string, error) {
	bytes := make([]byte, length)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}
