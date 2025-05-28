package internal

// import (
// 	"bytes"
// 	"encoding/base64"
// 	"fmt"
// 	"io"
// 	"mime/multipart"
// 	"net/http"
// 	"os"
// 	"path/filepath"
// 	"crypto/rand"
// )

// // UploadEncryptedFile — зашифровывает и отправляет файл
// func (a *App) UploadEncryptedFile(filePath string, serverURL string, token string) error {
// 	// читаем файл
// 	data, err := os.ReadFile(filePath)
// 	if err != nil {
// 		return fmt.Errorf("ошибка чтения: %w", err)
// 	}

// 	// генерируем AES-ключ
// 	key := make([]byte, 32)
// 	if _, err := rand.Read(key); err != nil {
// 		return fmt.Errorf("ошибка генерации ключа: %w", err)
// 	}

// 	// шифруем
// 	encrypted, err := EncryptAES256(data, key)
// 	if err != nil {
// 		return fmt.Errorf("ошибка шифрования: %w", err)
// 	}

// 	// multipart POST
// 	var buf bytes.Buffer
// 	writer := multipart.NewWriter(&buf)

// 	part, _ := writer.CreateFormFile("file", filepath.Base(filePath))
// 	part.Write(encrypted)
// 	writer.WriteField("key", base64.StdEncoding.EncodeToString(key))
// 	writer.Close()

// 	req, _ := http.NewRequest("POST", serverURL+"/api/files/upload", &buf)
// 	req.Header.Set("Authorization", "Bearer "+token)
// 	req.Header.Set("Content-Type", writer.FormDataContentType())

// 	resp, err := http.DefaultClient.Do(req)
// 	if err != nil {
// 		return fmt.Errorf("ошибка запроса: %w", err)
// 	}
// 	defer resp.Body.Close()

// 	if resp.StatusCode != http.StatusOK {
// 		body, _ := io.ReadAll(resp.Body)
// 		return fmt.Errorf("ошибка от сервера %d: %s", resp.StatusCode, body)
// 	}

// 	return nil
// }
