package crypto

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"

	"encoding/base64"
	"fmt"
	"io"
	"os/exec"
)

// FileEncryption предоставляет методы для шифрования/расшифровки файлов
type FileEncryption struct {
	gpgKeyID string
}

// EncryptedData содержит зашифрованные данные файла
type EncryptedData struct {
	EncryptedFile   []byte `json:"file"`
	EncryptedAESKey string `json:"key"`
	Nonce           []byte `json:"nonce"`
}

// NewFileEncryption создает новый экземпляр FileEncryption
func NewFileEncryption(gpgKeyID string) *FileEncryption {
	return &FileEncryption{
		gpgKeyID: gpgKeyID,
	}
}

// EncryptFile шифрует файл с использованием AES-GCM и GPG
func (fe *FileEncryption) EncryptFile(fileData []byte) (*EncryptedData, error) {
	if len(fileData) == 0 {
		return nil, fmt.Errorf("empty file data")
	}

	// Генерируем случайный AES ключ
	aesKey := make([]byte, 32) // AES-256
	if _, err := io.ReadFull(rand.Reader, aesKey); err != nil {
		return nil, fmt.Errorf("error generating AES key: %v", err)
	}

	// Шифруем AES ключ с помощью GPG
	encryptedKey, err := fe.encryptWithGPG(aesKey)
	if err != nil {
		return nil, fmt.Errorf("error encrypting AES key: %v", err)
	}

	// Создаем AES-GCM шифр
	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return nil, fmt.Errorf("error creating AES cipher: %v", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("error creating GCM: %v", err)
	}

	// Генерируем nonce
	nonce := make([]byte, 12) // Используем фиксированный размер 12 байт для AES-GCM
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("error generating nonce: %v", err)
	}

	// Шифруем файл
	encryptedFile := gcm.Seal(nil, nonce, fileData, nil)

	return &EncryptedData{
		EncryptedFile:   encryptedFile,
		EncryptedAESKey: string(encryptedKey),
		Nonce:           nonce,
	}, nil
}

// DecryptFile расшифровывает файл
func (fe *FileEncryption) DecryptFile(encData *EncryptedData) ([]byte, error) {
	if encData == nil {
		return nil, fmt.Errorf("encrypted data is nil")
	}
	if len(encData.EncryptedAESKey) == 0 {
		return nil, fmt.Errorf("encrypted AES key is empty")
	}
	if len(encData.EncryptedFile) == 0 {
		return nil, fmt.Errorf("encrypted file is empty")
	}
	if len(encData.Nonce) == 0 {
		return nil, fmt.Errorf("nonce is empty")
	}

	// Расшифровываем AES ключ с помощью GPG
	aesKey, err := fe.decryptWithGPG(encData.EncryptedAESKey)
	if err != nil {
		return nil, fmt.Errorf("error decrypting AES key: %v", err)
	}

	if len(aesKey) != 32 {
		return nil, fmt.Errorf("invalid AES key length after decryption: got %d, want 32", len(aesKey))
	}

	// Создаем AES-GCM шифр
	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return nil, fmt.Errorf("error creating AES cipher: %v", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("error creating GCM: %v", err)
	}

	if len(encData.Nonce) != gcm.NonceSize() {
		return nil, fmt.Errorf("invalid nonce size: got %d, want %d", len(encData.Nonce), gcm.NonceSize())
	}

	// Расшифровываем файл
	decryptedFile, err := gcm.Open(nil, encData.Nonce, encData.EncryptedFile, nil)
	if err != nil {
		return nil, fmt.Errorf("error decrypting file with AES-GCM: %v", err)
	}

	return decryptedFile, nil
}

// encryptWithGPG шифрует данные с помощью GPG
func (fe *FileEncryption) encryptWithGPG(data []byte) ([]byte, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("no data to encrypt")
	}

	if fe.gpgKeyID == "" {
		return nil, fmt.Errorf("GPG key ID is not set")
	}

	cmd := exec.Command("gpg",
		"--encrypt",
		"--armor", // Использовать ASCII-armor формат
		"--batch",
		"--yes",
		"--trust-model", "always",
		"--recipient", fe.gpgKeyID,
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("error creating stdin pipe: %v", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("error starting gpg: %v", err)
	}

	if _, err := stdin.Write(data); err != nil {
		stdin.Close()
		return nil, fmt.Errorf("error writing to gpg: %v", err)
	}
	stdin.Close()

	if err := cmd.Wait(); err != nil {
		return nil, fmt.Errorf("error encrypting with GPG: %v, stderr: %s", err, stderr.String())
	}

	result := stdout.Bytes()
	if len(result) == 0 {
		return nil, fmt.Errorf("GPG encryption produced empty output (stderr: %s)", stderr.String())
	}

	return result, nil
}

// decryptWithGPG расшифровывает данные с помощью GPG
func (fe *FileEncryption) decryptWithGPG(data string) ([]byte, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("no data to decrypt")
	}

	// Декодируем из base64
	decodedData, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		return nil, fmt.Errorf("error decoding base64: %v", err)
	}

	cmd := exec.Command("gpg",
		"--decrypt",
		"--batch",
		"--yes",
		"--quiet",
		"--trust-model", "always",
	)

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("error creating stdin pipe: %v", err)
	}

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("error starting gpg: %v", err)
	}

	if _, err := stdin.Write(decodedData); err != nil {
		stdin.Close()
		return nil, fmt.Errorf("error writing to gpg: %v, data length: %d", err, len(decodedData))
	}
	stdin.Close()

	if err := cmd.Wait(); err != nil {
		fmt.Printf("GPG stderr output: %s\n", stderr.String())
		return nil, fmt.Errorf("error decrypting with GPG: %v, stderr: %s", err, stderr.String())
	}

	result := stdout.Bytes()
	if len(result) == 0 {
		return nil, fmt.Errorf("GPG decryption produced empty output (stderr: %s)", stderr.String())
	}

	return result, nil
}
