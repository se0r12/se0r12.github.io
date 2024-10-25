function createBlogTables(blogs) {
    blogs.forEach(blog => {
        const tr = document.createElement("tr");
        const td_category = document.createElement("td");
        const td_title = document.createElement("td");
        const a = document.createElement("a");
        const blogCategory = blog[0];
        const blogTitle = blog[1];
        const blogPath = blog[2].replace(/\/?docs/, "");
        a.setAttribute("href", blogPath);
        a.setAttribute("onclick", "show(this);return false;");
        a.textContent = blogTitle;
        td_category.textContent = blogCategory;
        td_title.appendChild(a);
        tr.appendChild(td_category);
        tr.appendChild(td_title);
        table.tBodies[0].appendChild(tr);
    });
    document.body.appendChild(table);
}

const table = document.createElement("table");
table.appendChild(document.createElement("thead"));
const tr = document.createElement("tr");
const th_category = document.createElement("th");
const th_title = document.createElement("th");
th_category.textContent = "Category";
th_title.textContent = "Title";
tr.appendChild(th_category);
tr.appendChild(th_title);
table.tHead.appendChild(tr);
table.appendChild(document.createElement("tbody"));
