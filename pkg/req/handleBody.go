package req

import "net/http"

func HandleBody[T any](w *http.ResponseWriter, r *http.Request) (*T, error) {

	data, err := Decode[T](r.Body)
	if err != nil {
		return nil, err
	}

	if err := IsValid(data); err != nil {
		return nil, err
	}

	return data, nil
}
