import sanitizeHtml = require('sanitize-html');

export class Template {
  static HTML(title: string, list: string, body: string, control: string, user?: any): string {
    const authLinks = user 
        ? `<span style="margin-right:10px;">Welcome, <strong>${user.username}</strong> (${user.role})</span> <a href="/auth/logout">Logout</a>`
        : `<a href="/auth/login">Login</a> | <a href="/auth/register">Register</a>`;

    return `
    <!doctype html>
    <html>
    <head>
      <title>Fetching - ${title}</title>
      <meta charset="utf-8">
    </head>
    <body style="font-family: sans-serif; max-width: 800px; margin: auto; padding: 20px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
          <h1><a href="/" style="text-decoration:none; color:black;">Fetching</a></h1>
          <div>${authLinks}</div>
      </div>
      <hr>
      ${title !== 'Welcome to My Shop' ? '<h2>' + title + '</h2>' : ''}
      ${list}
      ${body}
      <p>${control}</p>
    </body>
    </html>
    `;
  }

  static list(products: any[]): string {
    let list = '<ul>';
    let i = 0;
    while (i < products.length) {
      list =
        list +
        `<li><a href="/product/${products[i].id}">[${products[i].brand_name}] ${products[i].product_name} - ${products[i].price}</a></li>`;
      i = i + 1;
    }
    list = list + '</ul>';
    return list;
  }

  static brandSelect(brands: any[], brand_id?: number): string {
    let tag = ``;
    for (let i = 0; i < brands.length; i++) {
      let selected = '';
      if (brands[i].id === brand_id) {
        selected = 'selected';
      }
      tag += `<option value="${brands[i].id}" ${selected}>${sanitizeHtml(
        brands[i].name,
      )}</option>`;
    }
    return `<select name="brand_id"> ${tag} </select>`;
  }
}
