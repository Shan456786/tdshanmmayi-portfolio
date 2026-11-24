/* PROJECTS: one entry per project. The homepage list, the archive (#/work) and every case study (#/work/<name>)
   read from here. cs holds the case study. Every fact in cs was read from the project's own repository
   (files listed in cs.sources). Diagrams and demos are labelled as diagrams or browser re-creations, never screenshots.
   shots: leave empty until real screenshots exist. When one does, put the image in src/assets/projects/<slug>/,
   import it at the top of the project file (import shot1 from '../../assets/projects/<slug>/home.webp') and add
   { src: shot1, alt: '...', cap: '...' }. See README.md, "Add a new project".
   A project with cs: null (Schedura) appears in the archive only. */

import foodbridge from './foodbridge.js';
import smartcrutch from './smartcrutch.js';
import campusExpert from './campus-expert.js';
import passwordGenerator from './password-generator.js';
import schedura from './schedura.js';

export const PROJECTS = [foodbridge, smartcrutch, campusExpert, passwordGenerator, schedura];
