package crypto

import (
	"encoding/base64"
	"fmt"
	"os/exec"
	"strings"
	"testing"
)

// ВАЖНО: убедись, что GPG настроен и есть ключ для тестирования
const testGPGKeyID = "akritas.vladimir@yandex.ru" // замените на действующий GPG key ID

func TestEncryptDecryptFile(t *testing.T) {
	if _, err := exec.LookPath("gpg"); err != nil {
		t.Skip("GPG is not installed, skipping test")
	}

	fe := NewFileEncryption(testGPGKeyID)

	originalData := []byte("Это тестовая строка")
	encData, err := fe.EncryptFile(originalData)
	if err != nil {
		t.Fatalf("failed to encrypt file: %v", err)
	}

	if len(encData.EncryptedFile) == 0 {
		t.Fatal("EncryptedFile is empty")
	}
	if len(encData.EncryptedAESKey) == 0 {
		t.Fatal("EncryptedAESKey is empty")
	}
	if len(encData.Nonce) == 0 {
		t.Fatal("Nonce is empty")
	}

	// Дешифруем и сверим
	decrypted, err := fe.DecryptFile(encData)
	if err != nil {
		t.Fatalf("failed to decrypt file: %v", err)
	}

	if string(decrypted) != string(originalData) {
		t.Errorf("Decrypted data does not match original.\nGot: %s\nWant: %s", decrypted, originalData)
	}
	fmt.Println("decrypted")
}

func TestEncryptEmptyFile(t *testing.T) {
	fe := NewFileEncryption(testGPGKeyID)
	_, err := fe.EncryptFile([]byte{})
	if err == nil || !strings.Contains(err.Error(), "empty file data") {
		t.Errorf("expected error on empty file data, got: %v", err)
	}
}

func TestDecryptInvalidKey(t *testing.T) {
	fe := NewFileEncryption(testGPGKeyID)

	data := &EncryptedData{
		EncryptedFile:   []byte{1, 2, 3},
		EncryptedAESKey: base64.StdEncoding.EncodeToString([]byte("invalid")),
		Nonce:           []byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12},
	}

	_, err := fe.DecryptFile(data)
	if err == nil {
		t.Error("expected error on invalid AES key")
	}
}
