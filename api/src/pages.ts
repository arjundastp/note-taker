// Minimal public web pages served by the API: a landing page and the privacy
// policy that Google Play requires. Plain HTML, no dependencies.
import { Router } from "express";

export const pagesRouter = Router();

const CONTACT_EMAIL = "arjun.das@fantacode.com"; // shown on the privacy policy
const UPDATED = "October 30, 2026";

const shell = (title: string, body: string) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  :root{color-scheme:light dark}
  body{font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;line-height:1.6;
       max-width:720px;margin:0 auto;padding:32px 20px;color:#1c1c1e;background:#fff}
  @media(prefers-color-scheme:dark){body{color:#eee;background:#111}}
  h1{font-size:1.8rem} h2{font-size:1.2rem;margin-top:1.6em}
  a{color:#0a7} code{background:#8882;padding:1px 5px;border-radius:4px}
  .muted{color:#8e8e93;font-size:.9rem}
</style></head><body>${body}</body></html>`;

pagesRouter.get("/", (_req, res) => {
  res.type("html").send(
    shell(
      "Notes",
      `<h1>Notes</h1>
       <p>A simple note-taking app — rich-text notes and ink sketches, pinning,
       and sharing as text, Markdown, or PDF.</p>
       <p class="muted"><a href="/privacy">Privacy Policy</a> · <a href="/delete-account">Delete your account</a></p>`,
    ),
  );
});

pagesRouter.get("/delete-account", (_req, res) => {
  res.type("html").send(
    shell(
      "Delete your account — Notes",
      `<h1>Delete your account</h1>
       <p>Deleting your account permanently removes your account and
       <strong>all of your notes and drawings</strong>. This cannot be undone.</p>
       <p>You can also do this inside the app: open it, tap <em>Sign out</em> area /
       account, and choose <em>Delete account</em>. Or use the form below.</p>

       <form id="f" style="display:flex;flex-direction:column;gap:12px;max-width:360px;margin-top:20px">
         <input id="email" type="email" placeholder="Email" required
           style="padding:12px;border:1px solid #8884;border-radius:10px;font-size:16px">
         <input id="password" type="password" placeholder="Password" required
           style="padding:12px;border:1px solid #8884;border-radius:10px;font-size:16px">
         <button type="submit"
           style="padding:14px;border:0;border-radius:10px;background:#d33;color:#fff;font-size:16px;font-weight:600">
           Delete my account
         </button>
       </form>
       <p id="msg" class="muted" style="margin-top:14px"></p>

       <script>
       const f=document.getElementById('f'),msg=document.getElementById('msg');
       f.addEventListener('submit',async(e)=>{
         e.preventDefault();
         if(!confirm('Permanently delete your account and all notes? This cannot be undone.'))return;
         msg.textContent='Deleting…';
         try{
           const email=document.getElementById('email').value.trim();
           const password=document.getElementById('password').value;
           const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
           if(!r.ok){const b=await r.json().catch(()=>({}));msg.textContent=b.error||'Wrong email or password.';return;}
           const {accessToken}=await r.json();
           const d=await fetch('/api/auth/me',{method:'DELETE',headers:{'Authorization':'Bearer '+accessToken}});
           msg.textContent=d.status===204?'Your account and all data have been deleted.':'Could not delete. Please try again.';
           if(d.status===204)f.style.display='none';
         }catch(err){msg.textContent='Something went wrong. Please try again.';}
       });
       </script>
       <p class="muted" style="margin-top:20px"><a href="/privacy">Privacy Policy</a></p>`,
    ),
  );
});

pagesRouter.get("/privacy", (_req, res) => {
  res.type("html").send(
    shell(
      "Privacy Policy — Notes",
      `<h1>Privacy Policy</h1>
       <p class="muted">Last updated: ${UPDATED}</p>

       <p>This Privacy Policy explains what the Notes app ("the app") collects and
       how it is used. By creating an account you agree to this policy.</p>

       <h2>Information we collect</h2>
       <ul>
         <li><strong>Account details:</strong> your email address and a password.
         Your password is never stored in plain text — only a one-way bcrypt hash.</li>
         <li><strong>Your content:</strong> the notes and drawings you create in the app.</li>
       </ul>

       <h2>How we use it</h2>
       <p>Your email and password are used only to sign you in and keep you signed in.
       Your notes are stored so they are available to you across sessions and devices.
       We do not use your content for advertising or profiling.</p>

       <h2>Storage and processors</h2>
       <p>Data is stored in a managed PostgreSQL database and served through our
       hosting provider. These providers process data solely to run the service and
       do not receive it for their own purposes.</p>

       <h2>Sharing</h2>
       <p>We do not sell or share your personal data with third parties, except as
       required to operate the service (the hosting and database providers above) or
       to comply with the law.</p>

       <h2>Data retention and deletion</h2>
       <p>You can delete your account at any time from within the app, or at
       <a href="/delete-account">${""}/delete-account</a>. Deleting your account
       permanently removes your account and all of your notes and drawings.</p>

       <h2>Security</h2>
       <p>Passwords are hashed with bcrypt and all traffic is encrypted over HTTPS.
       No method of storage or transmission is 100% secure, but we take reasonable
       measures to protect your data.</p>

       <h2>Children</h2>
       <p>The app is not directed to children under 13, and we do not knowingly
       collect data from them.</p>

       <h2>Changes</h2>
       <p>We may update this policy; the "last updated" date above reflects the latest
       revision.</p>

       <h2>Contact</h2>
       <p>Questions about this policy: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>`,
    ),
  );
});
