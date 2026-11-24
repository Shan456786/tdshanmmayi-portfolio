// Password Generator. See src/data/projects/index.js for how entries are used.
export default { name: 'Password Generator', tcls: 'ptt pt-pw', c: '#2E170E', fg: '#FCEFC7', tag: 'PYTHON PROJECT', line: 'A secure random password generator in Python.', tags: 'PYTHON / SECRETS',
    repo: 'https://github.com/Shan456786/Password-Generator', demo: '',
    cs: {
      kind: 'pw', kicker: 'SECURITY / PYTHON COMMAND LINE', type: 'Python project', started: 'Jun 2026', interactive: 'Working browser re-creation',
      deck: 'A small program with one firm rule: every password comes from a cryptographically secure source and always contains all four kinds of character.',
      overview: 'A Python command-line app that asks for a length and prints a password built with the secrets module. It is never stored.',
      problem: 'Python\'s random module is not meant for secrets, and a purely random draw can leave out a whole character type.',
      role: 'Written by Shanmayi: the algorithm, input validation and the command-line interface.',
      stack: [
        { g: 'Language', items: ['Python 3'] },
        { g: 'Standard library', items: ['secrets', 'string'] }
      ],
      steps: [
        { t: 'Validate', code: 'if length < 4: raise ValueError(...)', d: 'The length comes from int(input()). Anything that is not a whole number, or is below 4, ends in an error message instead of a password.' },
        { t: 'Guarantee', code: 'secrets.choice(uppercase), ... ', d: 'One character from each set: 26 uppercase, 26 lowercase, 10 digits, 32 punctuation marks.' },
        { t: 'Fill', code: 'for _ in range(length - 4)', d: 'The rest is drawn from all 94 characters combined, each with secrets.choice.' },
        { t: 'Shuffle', code: 'secrets.SystemRandom().shuffle(password)', d: 'Without this, the four guaranteed characters would always sit at the start, in the same order.' },
        { t: 'Print', code: 'print("Generated Password:", ...)', d: 'The password and its length are printed. Nothing is saved.' }
      ],
      code: 'def generate_password(length):\n    if length < 4:\n        raise ValueError("Password length must be at least 4.")\n\n    uppercase = string.ascii_uppercase\n    lowercase = string.ascii_lowercase\n    digits = string.digits\n    special = string.punctuation\n\n    password = [\n        secrets.choice(uppercase),\n        secrets.choice(lowercase),\n        secrets.choice(digits),\n        secrets.choice(special)\n    ]\n\n    all_characters = uppercase + lowercase + digits + special\n\n    for _ in range(length - 4):\n        password.append(secrets.choice(all_characters))\n\n    secrets.SystemRandom().shuffle(password)\n\n    return \'\'.join(password)',
      decisions: [
        { d: 'secrets, not random', t: 'secrets draws from the operating system\'s secure source. random is built for simulations, not passwords.' },
        { d: 'Guarantee first, then shuffle', t: 'Every password has all four types, and the shuffle removes the fixed positions the guarantee would create.' },
        { d: 'Minimum length of four', t: 'The shortest password that can hold one of each type.' },
        { d: 'Print, never store', t: 'The password exists only in the terminal output.' }
      ],
      limits: [
        'Every run uses all four character types. Choosing types is on the list of next steps.',
        'No option yet to exclude look-alike characters such as l, 1 and I.',
        'No strength estimate and no graphical interface yet.'
      ],
      shots: [],
      sources: ['main.py', 'README.md']
    } };
