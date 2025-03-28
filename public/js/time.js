const setTime = () => {
    let now = new Date();
    document.getElementById("time").textContent = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
}
setTime();
setInterval(setTime, 1000)
