package main

// import (
// 	"bytes"
// 	"testing"

// 	"github.com/AVY963/storage-app/backend/pkg/crypto"
// )

// func TestFileEncryption(t *testing.T) {
// 	// Инициализируем FileEncryption с тестовым GPG ключом
// 	fe := crypto.NewFileEncryption("D2386A4778B3460A")

// 	// Тестовые данные
// 	testData := []byte("Это тестовое сообщение для проверки шифрования")

// 	// Шифруем данные
// 	encrypted, err := fe.EncryptFile(testData)
// 	if err != nil {
// 		t.Fatalf("Ошибка при шифровании: %v", err)
// 	}

// 	// Проверяем, что все необходимые поля присутствуют
// 	if len(encrypted.EncryptedFile) == 0 {
// 		t.Error("Зашифрованный файл пуст")
// 	}
// 	if len(encrypted.EncryptedAESKey) == 0 {
// 		t.Error("Зашифрованный AES ключ пуст")
// 	}
// 	if len(encrypted.Nonce) == 0 {
// 		t.Error("Nonce пуст")
// 	}

// 	// Расшифровываем данные
// 	decrypted, err := fe.DecryptFile(encrypted)
// 	if err != nil {
// 		t.Fatalf("Ошибка при расшифровке: %v", err)
// 	}

// 	// Проверяем, что расшифрованные данные совпадают с исходными
// 	if !bytes.Equal(testData, decrypted) {
// 		t.Error("Расшифрованные данные не совпадают с исходными")
// 	}
// }
