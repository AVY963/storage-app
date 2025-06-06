package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"

	"github.com/AVY963/storage-app/backend/pkg/crypto"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx            context.Context
	fileEncryption *crypto.FileEncryption
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	// Инициализируем FileEncryption с ID ключа GPG из Yubikey
	a.fileEncryption = crypto.NewFileEncryption("akritas.vladimir@yandex.ru")
}

// EncryptAndPrepareFile шифрует файл для отправки на сервер
func (a *App) EncryptAndPrepareFile(file interface{}) (map[string]interface{}, error) {
	// Преобразуем входные данные в []byte
	var fileData []byte

	switch data := file.(type) {
	case []interface{}:
		// Преобразуем []interface{} в []byte
		fileData = make([]byte, len(data))
		for i, v := range data {
			if num, ok := v.(float64); ok {
				fileData[i] = byte(num)
			} else {
				return nil, fmt.Errorf("invalid array element type at index %d", i)
			}
		}
	default:
		return nil, fmt.Errorf("invalid file data type, expected array of numbers")
	}

	// Шифруем файл
	encData, err := a.fileEncryption.EncryptFile(fileData)
	if err != nil {
		return nil, fmt.Errorf("error encrypting file: %v", err)
	}

	// Преобразуем []byte в []interface{} для возврата в JavaScript
	encryptedFile := make([]interface{}, len(encData.EncryptedFile))
	encryptedKey := make([]interface{}, len(encData.EncryptedAESKey))
	nonce := make([]interface{}, len(encData.Nonce))

	for i, b := range encData.EncryptedFile {
		encryptedFile[i] = float64(b)
	}
	for i, b := range encData.EncryptedAESKey {
		encryptedKey[i] = float64(b)
	}
	for i, b := range encData.Nonce {
		nonce[i] = float64(b)
	}

	// Возвращаем зашифрованные данные
	return map[string]interface{}{
		"encrypted_file": encryptedFile,
		"encrypted_key":  encryptedKey,
		"nonce":          nonce,
	}, nil
}

// DecryptReceivedFile расшифровывает полученный с сервера файл
func (a *App) DecryptReceivedFile(encryptedFile string, encryptedKey string, nonce []byte) ([]interface{}, error) {

	encrypted_file, err := base64.StdEncoding.DecodeString(encryptedFile)
	if err != nil {
		return nil, fmt.Errorf("error decoding encrypted file: %v", err)
	}

	// Создаем структуру с зашифрованными данными
	encData := &crypto.EncryptedData{
		EncryptedFile:   encrypted_file,
		EncryptedAESKey: encryptedKey,
		Nonce:           nonce,
	}

	// Расшифровываем файл
	decryptedData, err := a.fileEncryption.DecryptFile(encData)
	if err != nil {
		return nil, fmt.Errorf("error decrypting file: %v", err)
	}

	// Преобразуем []byte в []interface{} для возврата в JavaScript
	result := make([]interface{}, len(decryptedData))
	for i, b := range decryptedData {
		result[i] = float64(b)
	}

	return result, nil
}

// SaveDownloadedFile сохраняет расшифрованные данные в файл через нативный диалог
func (a *App) SaveDownloadedFile(data []byte, defaultFilename string) error {
	// Создаем диалог выбора файла
	dialog, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: defaultFilename,
		Title:           "Сохранить файл",
	})

	if err != nil {
		return fmt.Errorf("ошибка при открытии диалога сохранения: %w", err)
	}

	// Если пользователь отменил выбор
	if dialog == "" {
		return nil
	}

	// Сохраняем файл
	err = os.WriteFile(dialog, data, 0644)
	if err != nil {
		return fmt.Errorf("ошибка при сохранении файла: %w", err)
	}

	return nil
}
