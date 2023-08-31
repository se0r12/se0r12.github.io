---
title: "Allsafe writeup"
date: 2023-08-31T20:48:13+09:00
draft: true
---

# Allsafe

## Insecure Logging

```text
Simple information disclosure vulnerability. Use the logcat command-line tool to discover sensitive information.
```

Allsafeを起動し、`Insecure Logging`を開きます。

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

User entered secretでgrepをかけておきます。

text fieldに値を入れEnterを押すと取得できていることがわかります。

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

という何やら良さそうなurlがありました。

`HardcodeCredentials.java`
```xml
<UsernameToken xmlns=\"http://siebel.com/webservices\">superadmin</UsernameToken>\n                 <PasswordText xmlns=\"http://siebel.com/webservices\">supersecurepassword</PasswordText>\n 
```
