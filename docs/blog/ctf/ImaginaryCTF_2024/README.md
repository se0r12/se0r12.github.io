# Imaginary CTF 2024

2024/07/20から2024/07/21にかけてImaginary CTF 2024に参加していました

heapnotesなる問題が解けずに悲しいので、復習したら載せます。

他のWeb問はチームのプロが解いていたので何もやっていません。

## crystals

与えられているソースコードはかなり少ない。

インフラは、`nginx < – > アプリケーション`のような感じ。

色々触っているとアプリケーション側の400 Bad Requestでhostnameが返ってきた。

```text
GET /\\/ HTTP/1.1
```

のようなリクエストを送るとフラグが降ってくる。

`ictf{seems_like_you_broke_it_pretty_bad_76a87694}`

