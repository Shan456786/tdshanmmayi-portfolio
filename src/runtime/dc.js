// The standalone replacement for Claude Design's canvas runtime.
//
// The page is one React class component. Its logic class extends DCLogic (a plain React.Component) and provides
// renderVals(); the compiled template turns those values into elements. bindTemplate() joins the two.
import { Component } from 'react';

export class DCLogic extends Component {}

/** Gives the logic class its render(): the compiled template applied to renderVals(). */
export function bindTemplate(LogicClass, template) {
  LogicClass.prototype.render = function render() {
    return template(this.renderVals());
  };
}
