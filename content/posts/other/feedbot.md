+++
date = '2025-04-06T19:36:50+09:00'
title = 'Feedbotを作った話'
+++

セキュリティの最新技術を追うために、[Feedly](https://feedly.com/)を利用していた。

ただし、無料版だと検索ができないから、「あの記事どこでみたんだっけな」という問題に対処ができなくて、少し辛い思いをしていた。\
もちろん決まったいくつかのサイトしか見ていなかったので、全てのサイトで断片的な情報を検索すれば見つかるわけだが、そんなことをするのはめんどくさい。

また、Feedlyをわざわざ開かないという問題があった。\
人間 (というか私)は、基本的にいつも使うアプリしか開かない。\
習慣化すればいいのだが、なかなか上手くいかなかった。\
おそらく、「記事を読むぞ！」という気持ちになかなかなれないのが原因。

技術ブログを見るときは「読むぞ」より「目についたし面白そうだから読むか」くらいの気持ちで基本的に見ているので、「読むぞ」という気持ちを持たないで開けるアプリケーションにFeedを送りたかった。

さて、現在出た問題は二つ

- Feedlyは検索機能を無料版だと持たない
- 読むぞという気持ちを持たないで記事が目につく環境が欲しい

これを解決できそうなアプリケーション。。それはDiscordだ！となった。

はい。前置きが長くなりましたが、DiscordにFeedBotを作成しましたよという話。

## 環境

今回は、Google Cloud上で作成した。

理由としては、Cloudに今まで触れてこなかったが、今の仕事では理解しておかないとかなり辛くなりそうだったから、試しに使ってみるかという気持ちで。

使ったGoogle Cloudのサービスは以下3点

- Google Cloud Functions (Google Cloud Run Functionsって名前になったのかな)
- Cloud Storage
- Cloud Scheduler

ざっくりどういう処理をしているかというと、Cloud Schedulerで、6時、12時、18時にFunctionsにリクエストを飛ばす。\
Functionsはリクエストを受け取ったら、FeedをDiscord Web hook目掛けて飛ばす。\
飛ばしたTitle, URLをCloud Storageに保存してキャッシュ的な役割をしてもらう。

こんな感じ。

無料枠で今やっているけど、無料枠が終わって月 1000yenくらいかかってくるとFeedlyと変わらなくなるので少し微妙。\
500yenくらいなら安いのでそのまま生きさせる予定。

工夫した点としては、
- Google Cloudのサービスを触って、こういうところに気をつけないといけないんだな〜とかセキュリティ周りのこと (工夫というか学び？)
- Cloud Storageのデータ量を減らすためにTitleとURLをmd5でハッシュ化した値を書き込むという方式 (どれほど変わるのか。)

AIが近くにいると、かなり助かるけどClaudeの情報が古かったりして、変化の早いCloudとは少し相性が悪い気もした。

今の所、CTFチームのメンバーと、前職でお世話になった先輩に入ってもらっているが、役に立ってそう+金そこまでかからんなとわかったら、先着 5名くらいで受け入れてもいいかもしれない。
