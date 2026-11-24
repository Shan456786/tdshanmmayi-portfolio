import { DCLogic } from '../runtime/dc.js';
import { initialState } from './initial-state.js';
import { installCore } from './setup/core.js';
import { installHall } from './setup/hall.js';
import { installNavigation } from './setup/navigation.js';
import { installRooms } from './setup/rooms.js';
import { installWork } from './setup/work.js';
import { installLearningLab } from './setup/learning-lab.js';
import { installPlayground } from './setup/playground.js';
import { installContact } from './setup/contact.js';
import { lifecycleMethods } from './methods/lifecycle.js';
import { routingMethods } from './methods/routing.js';
import { focusMethods } from './methods/focus.js';
import { leetcodeMethods } from './methods/leetcode.js';
import { caseStudyMethods } from './methods/case-studies.js';
import { playgroundMethods } from './methods/playground.js';
import { stageMethods } from './methods/stage.js';
import { viewModelMethods } from './methods/view-model.js';

// The whole page is one component. Its constructor is split by feature (./setup), its methods by feature (./methods).
// The markup it renders lives in src/template (see src/template/README.md).
export class Component extends DCLogic {
  constructor(...args) {
    super(...args);
    this.state = initialState();
    installCore.call(this);
    installHall.call(this);
    installNavigation.call(this);
    installRooms.call(this);
    installWork.call(this);
    installLearningLab.call(this);
    installPlayground.call(this);
    installContact.call(this);
  }
}

Object.assign(
  Component.prototype,
  lifecycleMethods,
  routingMethods,
  focusMethods,
  leetcodeMethods,
  caseStudyMethods,
  playgroundMethods,
  stageMethods,
  viewModelMethods
);
