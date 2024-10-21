# HACK.LU CTF 2024

普通に難しい有名なCTFだったらしい。

https://ctftime.org/event/2438

## BUFFZONE (web)

他の問題が多くて4 solveなのに、こいつは103 solveとかなり解かれていた。

(から解けてよかった。)

![](/blog/ctf/Hack.luCTF2024/2024-10-21-16-39-18.png)

```js
// app.js
const md = markdownit()
...
function replaceUrls(text) {
    let regex = /(https:\/\/.*?)\s/gi;
    let replacedText = text.replace(regex, '<a href="$1">$1</a>');
    return replacedText;
}
...
app.get("/buffzone", (req, res) => {
    let message = req.query.message;
    if (message) {
        res.render("buffzone", { message: replaceUrls(md.render("**" + message + "**")) })
    }
    else {
        res.redirect("/")
    }
});
```

markdown-itのrender関数にユーザの入力値が渡り、replaceUrls関数で置き換えをした結果でXSSをしましょうという問題。

フラグはBotのCookieにある。

`![]()`が`<img src="" alt="">`になるらしい。

replaceUrlsをみると、`https://`が`<a href=""></a>`になるらしいので、`![](https://)`は、`<img src="<a href="https://">https://</a>" alt="">`のような感じになる。

この時、ブラウザ (Firefox)での解釈は`<img src="<a href=" https:="" "="">`になっていた。

では、`![](https://onerror=alert(1))`にすると？
`<img src="<a href="https://onerror=alert(1)">https://onerror=alert(1)</a>" alt="">`で、ブラウザは`<img src="<a href=" https:="" onerror="alert(1)&quot;">`のように解釈していた。

`alert(1)//`にするとpopupは確認できたので後はやるだけ。

`""`で文字列を囲むとかが苦手っぽかったのでString.fromCodePointで文字列を作ってeval。

`flag{y0u_4r3_buff_en0ugh}`

