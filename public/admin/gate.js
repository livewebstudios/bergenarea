/* Role gate for one editor.
   The page sets <html data-role="convention"> (or activities, area, webmaster) and loads, in order:
   this file's prerequisites (window.CMS_MANUAL_INIT = true, the Netlify Identity widget, Decap 3.1.2), then this file.
   Decap starts only for a logged-in user whose Identity roles include this editor's role or "webmaster".
   Anyone else sees one plain sentence and a link back to the hub. On localhost (Decap local_backend
   testing) there is no Identity, so the gate is skipped. */
(function () {
  var role = document.documentElement.getAttribute('data-role');
  var host = window.location.hostname;
  var local = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost');
  var started = false;

  function rolesOf(user) {
    return (user && user.app_metadata && user.app_metadata.roles) || [];
  }
  function allowed(user) {
    var roles = rolesOf(user);
    return roles.indexOf(role) !== -1 || roles.indexOf('webmaster') !== -1;
  }
  function start() {
    if (started) return;
    started = true;
    var wait = document.getElementById('gate-wait');
    if (wait) wait.remove();
    window.CMS.init();
  }
  function refuse() {
    var wait = document.getElementById('gate-wait');
    if (wait) wait.remove();
    var box = document.createElement('div');
    box.className = 'gate-msg';
    box.setAttribute('role', 'alert');
    box.innerHTML = '<p>This login does not have access to this editor.</p>' +
      '<p class="row"><a class="btn" href="../">Back to Site Admin</a> <button type="button" class="btn btn--quiet" id="gate-logout">Log out</button></p>';
    document.body.appendChild(box);
    document.getElementById('gate-logout').addEventListener('click', function () { window.netlifyIdentity.logout(); });
  }

  if (local) { start(); return; }

  var id = window.netlifyIdentity;
  if (!id) { refuse(); return; }
  id.on('init', function (user) {
    if (!user) { id.open('login'); return; }
    if (allowed(user)) start(); else refuse();
  });
  id.on('login', function (user) {
    id.close();
    if (allowed(user)) start(); else refuse();
  });
  id.on('logout', function () { window.location.href = '../'; });
})();
