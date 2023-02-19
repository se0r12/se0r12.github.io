---
title: "Incognito 4.0 ctf"
date: 2023-02-19T21:54:11+09:00
tags: [ "ctf" ]
draft: false
---
# Incognito 4.0

## 初めに。

2023/02/18(土)は、`Incognito 4.0(ictf)`に参加していました。

![image](https://user-images.githubusercontent.com/93389879/219865072-c402c755-4bdd-4b77-a47c-159514f593fe.png)

`get flag1`だけは、問題を見ながらのwriteupが書けましたが、21:00で終わると思っていなかったため、残りはうろ覚えです。

## 結果

![image](https://user-images.githubusercontent.com/93389879/219865581-bba4d8c0-73aa-49d5-80e7-6ed6c73f9fad.png)

## Web

### get flag1

![image](https://user-images.githubusercontent.com/93389879/219864546-249ec4aa-cc38-463f-8530-b3de3aa676ad.png)

アクセスするとこのような画面にいきます。

URLを入力するようなのでとりあえず、`https://example.com`を入れると、以下のようになりました。

![image](https://user-images.githubusercontent.com/93389879/219864573-192bd923-0027-432d-8947-202fdc159eaf.png)

ただ、redirectしていると思ったので、`open redirect via ssrf`とか？と思ったのですが、全然違いました。し、そもそも行えるのかが疑問です。

SSRFの脆弱性があるところとは別のところに`open redirect`があるとssrfの対策を回避可能みたいな認識なので。

今回はどうも、指定したURLに対して`fetch(?)`かなんかでgetした内容をそのまま表示しているっぽい？(間違っているかも)

画面が変わっていたので、リダイレクトしているんだろうと先入観に囚われ、諦めそうでした。(どうせ私にはわからんやろなって)

ただURLを見てみると、`http://45.79.210.216:5000/getUrl?url=http%3A%2F%2Fexample.com`。なので、単純なSSRFを行えば行けるか？と思い、とりあえず`http://127.0.0.1:9001/flag.txt`としていましたが、

```json
{"status":500,"message":"Error Fetching URL"}
```

のようにエラーが出てきてしまいます。

まぁそりゃそうかと思いつつ、ペイロードをちょっと換えて、`http://0.0.0.0:9001/flag.txt`とすると、上手くいきました。

```text
ictf{l0c4l_byp4$$_323theu0a9}
```

### get flag2

これも同じような問題で、アクセス時の画像は`get flag1`と同じでした。

ただ、フィルターをちょっと厳しめにしたような問題でした

ペイロードは、`http://[::]:9001/`だった気がします。

ただペイロードを何のひねりも入れずちょっと変えるだけだったので問題なかったです。

### massive

urlにアクセスすると、メールアドレス、パスワードを使用して登録できるフォームと、メールアドレスが登録されているかをチェックできるフォーム。

後はlogin画面のurlが別にあるような問題でした。

`test@test.com`で行ったところ、`exist`となったので、とりあえずチェックをしてみると、`{status: exist, isAdmin: false}`のような出力が飛んできました。

登録時に`isAdmin: true`にすればいいだろうと思ったので、`Cookie: isAdmin=true`と、body parameterに`isAdmin=true`として送りつけました。

どっちが正解だったかは試していない(試そうとしたら終わってた)のですが、多分bodyだろうなと思います。

## Rev

### Meow

一番点が低かったので、`strings`でフラグげ取れないかなと思いやってみました。

```bash
$file meow
meow: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=e5364dd913e17a0a897677ff1234cbd21547bdd8, for GNU/Linux 4.4.0, not stripped
```

```bash
$strings meow
strings meow
/lib64/ld-linux-x86-64.so.2
__libc_start_main
__cxa_finalize
libc.so.6
GLIBC_2.2.5
GLIBC_2.34
_ITM_deregisterTMCloneTable
__gmon_start__
_ITM_registerTMCloneTable
PTE1
u3UH
GCC: (GNU) 12.2.1 20230201
_DYNAMIC
__GNU_EH_FRAME_HDR
_GLOBAL_OFFSET_TABLE_
__libc_start_main@GLIBC_2.34
_ITM_deregisterTMCloneTable
_edata
_fini
__data_start
__gmon_start__
__dso_handle
_IO_stdin_used
_end
__bss_start
main
__TMC_END__
_ITM_registerTMCloneTable
__cxa_finalize@GLIBC_2.2.5
_init
.symtab
.strtab
.shstrtab
.interp
.note.gnu.property
.note.gnu.build-id
.note.ABI-tag
.gnu.hash
.dynsym
.dynstr
.gnu.version
.gnu.version_r
.rela.dyn
.init
.text
.fini
.rodata
.eh_frame_hdr
.eh_frame
.init_array
.fini_array
.dynamic
.got
.got.plt
.data
.bss
.comment
```

悔しい。何もなかった。。。

とりあえず解析するのは面倒だなと思いまして、`chmod`するのも面倒なので、`.rodate`セクションとか、`.data`とかを見てみようかなと思い、`.rodate`を見ると

```bash
px @0x00002000
- offset -   0 1  2 3  4 5  6 7  8 9  A B  C D  E F  0123456789ABCDEF
0x00002000  0100 0200 0000 0000 0069 0063 0074 0066  .........i.c.t.f
0x00002010  007b 0065 0061 0073 0069 0065 0073 0074  .{.e.a.s.i.e.s.t
0x00002020  005f 0063 0068 0061 006c 006c 0065 006e  ._.c.h.a.l.l.e.n
0x00002030  0067 0065 005f 006f 0066 005f 0074 0068  .g.e._.o.f._.t.h
0x00002040  0065 006d 005f 0061 006c 006c 007d 0000  .e.m._.a.l.l.}..
0x00002050  011b 033b 1c00 0000 0200 0000 d0ef ffff  ...;............
0x00002060  3800 0000 c9f0 ffff 5000 0000 0000 0000  8.......P.......
0x00002070  1400 0000 0000 0000 017a 5200 0178 1001  .........zR..x..
0x00002080  1b0c 0708 9001 0000 1400 0000 1c00 0000  ................
0x00002090  90ef ffff 2600 0000 0044 0710 0000 0000  ....&....D......
0x000020a0  1c00 0000 3400 0000 71f0 ffff 1200 0000  ....4...q.......
0x000020b0  0041 0e10 8602 430d 064d 0c07 0800 0000  .A....C..M......
0x000020c0  0000 0000 ffff ffff ffff ffff ffff ffff  ................
0x000020d0  ffff ffff ffff ffff ffff ffff ffff ffff  ................
0x000020e0  ffff ffff ffff ffff ffff ffff ffff ffff  ................
0x000020f0  ffff ffff ffff ffff ffff ffff ffff ffff  ................
```

これじゃね？<=これでした

```text
ictf{easiest_challenge_of_them_all}
```
## Pwn

### babyFlow

上手く説明できないので割愛

というのも、ペイロードが荒業感がすごかった。

Bofのゴミデータの数が特定ができず、運ゲーで通ったようなものだったので...

## last

CTFを最近ちゃんとやり始めている中、解ける問題が増えた気がするのは嬉しいですね。。

ただ初心者向けで自己肯定感を多少上げてくれる心優しいCTFでした感謝。

