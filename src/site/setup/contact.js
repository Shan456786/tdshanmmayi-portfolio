import { CONTACT } from '../../data/profile.js';
// Contact. Runs once from the Component constructor with `this` set to the component.
export function installContact() {
  /* contact */
  this.copyEmail = () => {
      const v = CONTACT.email;
      if (!v) return;
      const done = () => {
        this.setState({ copied: true });
        this.say('Copied ' + v + ' to your clipboard.');
        clearTimeout(this.ct);
        this.ct = setTimeout(() => this.setState({ copied: false }), 2600);
      };
      const fallback = () => {
        let ok = false;
        try {
          const ta = document.createElement('textarea');
          ta.value = v; ta.setAttribute('readonly', '');
          ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          ok = document.execCommand('copy');
          document.body.removeChild(ta);
        } catch (err) { ok = false; }
        if (ok) done(); else this.say('This page cannot reach your clipboard. The address is ' + v);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, fallback);
        else fallback();
      } catch (err) { fallback(); }
    };
}
