# iOS CI/CD Setup Guide

## GitHub Secrets 設定清單

前往 GitHub → Settings → Secrets and variables → Actions，新增以下 Secrets：

### 必要 Secrets（簽名憑證）

| Secret 名稱 | 說明 | 如何取得 |
|-------------|------|---------|
| `BUILD_CERTIFICATE_BASE64` | iOS 發布憑證 (.p12) 的 Base64 | 見下方步驟 1 |
| `P12_PASSWORD` | .p12 憑證的密碼 | 匯出時自訂 |
| `BUILD_PROVISION_PROFILE_BASE64` | Provisioning Profile 的 Base64 | 見下方步驟 2 |
| `KEYCHAIN_PASSWORD` | 暫時 Keychain 密碼（任意字串） | 自訂，例如 `my-keychain-pass` |

### TestFlight 上傳 Secrets（選填，若要上傳到 TestFlight）

| Secret 名稱 | 說明 | 如何取得 |
|-------------|------|---------|
| `APP_STORE_CONNECT_API_KEY_ID` | API Key ID | App Store Connect → Keys |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID | App Store Connect → Keys |
| `APP_STORE_CONNECT_API_KEY_BASE64` | .p8 Key 檔案的 Base64 | 見下方步驟 3 |

---

## 步驟說明

### 步驟 1：匯出 iOS 發布憑證

1. 在 Mac 開啟 **Keychain Access**
2. 找到 `Apple Distribution: Your Name` 憑證
3. 右鍵 → **Export** → 存成 `.p12`，設定密碼
4. 執行 Base64 編碼：
   ```bash
   base64 -i certificate.p12 | pbcopy
   ```
5. 貼到 GitHub Secret `BUILD_CERTIFICATE_BASE64`

### 步驟 2：匯出 Provisioning Profile

1. 登入 [Apple Developer Portal](https://developer.apple.com)
2. Certificates, IDs & Profiles → Profiles
3. 建立或下載 **App Store** 類型的 Profile（Bundle ID: `com.fluentai.app`）
4. 執行 Base64 編碼：
   ```bash
   base64 -i profile.mobileprovision | pbcopy
   ```
5. 貼到 GitHub Secret `BUILD_PROVISION_PROFILE_BASE64`

### 步驟 3：建立 App Store Connect API Key

1. 登入 [App Store Connect](https://appstoreconnect.apple.com)
2. Users and Access → Keys → 新增 Key（Developer 權限）
3. 下載 `.p8` 檔案（只能下載一次！）
4. 記錄 **Key ID** 和 **Issuer ID**
5. Base64 編碼 .p8 檔：
   ```bash
   base64 -i AuthKey_XXXXXXXX.p8 | pbcopy
   ```

---

## 觸發 Build

### 自動觸發
- Push 到 `main` 或 `claude/vigilant-carson-53pYD` 分支時自動 build

### 手動觸發（含 TestFlight 上傳）
1. GitHub → Actions → iOS Build & Deploy
2. Run workflow → 勾選 **Deploy to TestFlight**
3. Run workflow

---

## Build 產物

- Build 成功後，IPA 檔案會存在 **GitHub Actions Artifacts**
- 保留 14 天，可手動下載安裝測試
