// Terms that must never appear in this repository or on the site. They are stored reversed on purpose,
// so the words themselves do not appear anywhere in the public repository. Used by audit-repo.mjs and the browser tests.
const rev = (s) => [...s].reverse().join('');
/** Private photographs. */
export const NO_PHOTO = new RegExp([rev('oottat'), rev('otohp-kni')].join('|'), 'i');
/** A project that is not finished and must not be shown. */
export const NO_PROJECT = new RegExp(rev('motnahp') + '\\s*-?\\s*' + rev('cos'), 'i');
