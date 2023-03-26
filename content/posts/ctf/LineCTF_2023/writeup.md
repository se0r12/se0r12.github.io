---
title: "Line CTF 2023 writeup"
date: 2023-03-26T15:57:06+09:00
draft: false
---

# Line CTF 2023

## 初めに

2023/03/25は、Line CTF 2023に参加していました。

![image](https://user-images.githubusercontent.com/93389879/227760524-8053e2b8-9759-4534-a1d7-ce15c3475d31.png)

Baby Simple GoCurlしか解けませんでしたが、頭を使って楽しかったです。

Webもっと解けるようになりたいな(n回目)

## writeup

## Baby Simple GoCurl

アクセスすると、こんな感じの画面が出てきます。

![image](https://user-images.githubusercontent.com/93389879/227760581-bc94bf00-ba75-48b9-bfe7-b3c5b436b9c7.png)

`https://example.com`を試しに入れるとこんな感じ。

![image](https://user-images.githubusercontent.com/93389879/227760654-d05caef8-ed10-4791-83ca-2e7333670f97.png)

コードを見てみると、以下がかなり邪魔しそうです。

```Go
if c.ClientIP() != "127.0.0.1" && (strings.Contains(reqUrl, "flag") || strings.Contains(reqUrl, "curl") || strings.Contains(reqUrl, "%")) {
    c.JSON(http.StatusBadRequest, gin.H{"message": "Something wrong"})
    return
}
```

`ClinetIP()`は文字通り、接続元のIPなので接続元のIPをどうにかして`127.0.0.1`にしなければならない事がわかります。

これは、`X-Forwarded-For`headerをつけてあげることで回避ができます。

```text
X-Forwarded-For: 127.0.0.1
```

ClientIP()が`127.0.0.1`になった事が確認出来たら、先ほどの邪魔しそうな部分が回避できることがわかります。

```go
if false && true => false
```

となるため

ここまで来たら、ひとまず以下のようにして送ってみます。

![image](https://user-images.githubusercontent.com/93389879/227761143-69eeaa72-8ef1-4644-a512-7c6c94e48398.png)


```text
You are a Guest, This is only for Host
```

`/flag/`にはアクセスできているものの、

```go
if reqIP == "127.0.0.1" {
    c.JSON(http.StatusOK, gin.H{
        "message": flag,
    })
    return
}
```

この部分に引っかかっていなさそうです。

じゃあ直して。。

![image](https://user-images.githubusercontent.com/93389879/227761663-150964de-3ab0-401b-b304-606753cb25b2.png)

上手くいってないですね。詰まった末、`default port`を調べてみると、`8080`とあったのでportを変えて再度リクエスト、、

![image](https://user-images.githubusercontent.com/93389879/227761739-fcd775e6-1191-48f9-abd0-55b64efe790e.png)

```text
LINECTF{6a22ff56112a69f9ba1bfb4e20da5587}
```

## 最後

writeupは終わった後サーバがまだ動いていたので、書きましたが、普通に解法忘れてどうだっけ。になってました。
