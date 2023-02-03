---
title: "Archlinuxで32bit実行可能ファイルを実行する方法"
date: 2023-02-03T16:08:21+09:00
tags: [ "Archlinux", "ctf" ]
draft: false
---

# 概要
Pwnを勉強しているとき、`32bit executable file`を実行する方法がよくわからなかったので、それの対処を書くだけのブログ。

最初、ファイルが与えられたとき、実行をしてみると、

```
Check the interpreter or linker?
```

このようなエラーが出た。

# 対処

いろいろ調べていると、`/etc/pacman.conf`の、

```
[multilib]
Include = /etc/pacman.d/mirrorlist
```

この部分のコメントアウトをまず外す

次に、`パッケージの更新`

```bash
sudo pacman -Syy
```

次に、`pacage`一覧の取得

```bash
pacman -Sl multilib
```

これができたら、

```bash
sudo pacman -S lib32-glibc
```

多分これで実行できます。
